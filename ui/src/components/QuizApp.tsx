import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { Contract } from 'ethers';

import { QUIZ_ADDRESS, QUIZ_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { Header } from './Header';
import { QuestionCard } from './QuestionCard';
import '../styles/QuizApp.css';

type Question = {
  prompt: string;
  options: string[];
  reward: number;
};

const QUESTION_IDS = [0n, 1n];
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function QuizApp() {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({ 0: null, 1: null });
  const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({ 0: false, 1: false });
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, boolean | null>>({ 0: null, 1: null });
  const [decrypting, setDecrypting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: questionsData } = useReadContracts({
    contracts: QUESTION_IDS.map((questionId) => ({
      address: QUIZ_ADDRESS,
      abi: QUIZ_ABI,
      functionName: 'getQuestion',
      args: [questionId],
    })),
  });

  const questions: Question[] = useMemo(() => {
    if (!questionsData) {
      return [];
    }

    return questionsData.map((item) => {
      const [prompt, optionOne, optionTwo, rewardRaw] = item as readonly [string, string, string, bigint];
      return {
        prompt,
        options: [optionOne, optionTwo],
        reward: Number(rewardRaw),
      };
    });
  }, [questionsData]);

  const { data: answeredData, refetch: refetchAnswered } = useReadContracts({
    contracts: address
      ? QUESTION_IDS.map((questionId) => ({
          address: QUIZ_ADDRESS,
          abi: QUIZ_ABI,
          functionName: 'hasAnswered',
          args: [address, questionId],
        }))
      : [],
    query: {
      enabled: Boolean(address),
    },
  });

  const answeredFlags = useMemo(() => {
    if (!answeredData) {
      return QUESTION_IDS.map(() => false);
    }
    return answeredData.map((item) => Boolean(item));
  }, [answeredData]);

  const { data: encryptedResultsData, refetch: refetchResults } = useReadContracts({
    contracts: address
      ? QUESTION_IDS.map((questionId) => ({
          address: QUIZ_ADDRESS,
          abi: QUIZ_ABI,
          functionName: 'getEncryptedResult',
          args: [address, questionId],
        }))
      : [],
    query: {
      enabled: Boolean(address),
    },
  });

  const encryptedResults = useMemo(() => {
    if (!encryptedResultsData) {
      return QUESTION_IDS.map(() => ZERO_HANDLE);
    }
    return encryptedResultsData.map((item) => String(item));
  }, [encryptedResultsData]);

  const { data: encryptedScore, refetch: refetchScore } = useReadContract({
    address: QUIZ_ADDRESS,
    abi: QUIZ_ABI,
    functionName: 'getEncryptedScore',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const decryptHandles = useCallback(
    async (handles: string[]) => {
      if (!instance || !address) {
        return {} as Record<string, string>;
      }

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer is unavailable for decryption');
      }

      const filtered = Array.from(
        new Set(handles.filter((handle) => handle && handle !== ZERO_HANDLE)),
      );

      if (filtered.length === 0) {
        return {} as Record<string, string>;
      }

      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contractAddresses = [QUIZ_ADDRESS];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays,
      );

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const handleContractPairs = filtered.map((handle) => ({
        handle,
        contractAddress: QUIZ_ADDRESS,
      }));

      const decrypted = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      return decrypted as Record<string, string>;
    },
    [instance, address, signer],
  );

  useEffect(() => {
    if (!address || !instance) {
      setScore(null);
      setResults({ 0: null, 1: null });
      return;
    }

    const handles: string[] = [];

    if (typeof encryptedScore === 'string' && encryptedScore !== ZERO_HANDLE) {
      handles.push(encryptedScore);
    }

    encryptedResults.forEach((handle) => {
      if (handle && handle !== ZERO_HANDLE) {
        handles.push(handle);
      }
    });

    if (handles.length === 0) {
      if (typeof encryptedScore === 'string') {
        setScore(encryptedScore === ZERO_HANDLE ? 0 : null);
      }
      return;
    }

    setDecrypting(true);
    decryptHandles(handles)
      .then((decrypted) => {
        if (typeof encryptedScore === 'string') {
          if (encryptedScore === ZERO_HANDLE) {
            setScore(0);
          } else if (decrypted[encryptedScore] !== undefined) {
            setScore(Number(decrypted[encryptedScore]));
          }
        }

        const updated: Record<number, boolean | null> = {};
        encryptedResults.forEach((handle, index) => {
          if (!handle || handle === ZERO_HANDLE) {
            updated[Number(QUESTION_IDS[index])] = null;
            return;
          }

          if (decrypted[handle] !== undefined) {
            updated[Number(QUESTION_IDS[index])] = decrypted[handle] === '1';
          }
        });

        if (Object.keys(updated).length > 0) {
          setResults((prev) => ({ ...prev, ...updated }));
        }
      })
      .catch((error) => {
        console.error('Failed to decrypt handles', error);
      })
      .finally(() => setDecrypting(false));
  }, [address, instance, encryptedScore, encryptedResults, decryptHandles]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitAnswer = async (questionId: number) => {
    if (!address) {
      setSubmissionError('Connect your wallet to answer the quiz.');
      return;
    }

    if (!instance) {
      setSubmissionError('Encryption service is not ready yet.');
      return;
    }

    const optionIndex = selectedOptions[questionId];
    if (optionIndex === null || optionIndex === undefined) {
      setSubmissionError('Select an option before submitting.');
      return;
    }

    const resolvedSigner = await signer;
    if (!resolvedSigner) {
      setSubmissionError('Wallet signer is unavailable.');
      return;
    }

    try {
      setSubmissionError(null);
      setIsSubmitting((prev) => ({ ...prev, [questionId]: true }));

      const input = instance.createEncryptedInput(QUIZ_ADDRESS, address);
      input.add32(optionIndex);
      const encrypted = await input.encrypt();

      const contract = new Contract(QUIZ_ADDRESS, QUIZ_ABI, resolvedSigner);
      const tx = await contract.submitAnswer(questionId, encrypted.handles[0], encrypted.inputProof);

      await tx.wait();

      await Promise.all([
        refetchAnswered?.(),
        refetchResults?.(),
        refetchScore?.(),
      ]);
    } catch (error) {
      console.error('Failed to submit answer', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to submit encrypted answer');
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <div className="quiz-app">
      <Header />

      <main className="quiz-main">
        <section className="quiz-score">
          <h2 className="quiz-score__title">Encrypted Score</h2>
          {address ? (
            <p className="quiz-score__value">
              {decrypting || zamaLoading
                ? 'Decrypting...'
                : score !== null
                  ? `${score} pts`
                  : 'Encrypted — unlock by decrypting'}
            </p>
          ) : (
            <p className="quiz-score__value">Connect your wallet to start the adventure.</p>
          )}
          <p className="quiz-score__hint">
            Answers and rewards stay private thanks to Zama FHE. Only your wallet can decrypt them.
          </p>
          {zamaError && <p className="quiz-score__error">{zamaError}</p>}
        </section>

        {submissionError && <div className="quiz-alert">{submissionError}</div>}

        <section className="quiz-questions">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.prompt}
              questionId={index}
              prompt={question.prompt}
              options={question.options}
              reward={question.reward}
              selectedOption={selectedOptions[index] ?? null}
              onSelect={(optionIndex) => handleSelectOption(index, optionIndex)}
              onSubmit={() => handleSubmitAnswer(index)}
              isSubmitting={Boolean(isSubmitting[index])}
              answered={answeredFlags[index] ?? false}
              result={results[index] ?? null}
              decrypting={decrypting}
              zamaLoading={zamaLoading}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
