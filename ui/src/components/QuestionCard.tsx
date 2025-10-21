import '../styles/QuestionCard.css';

type QuestionCardProps = {
  questionId: number;
  prompt: string;
  options: string[];
  reward: number;
  selectedOption: number | null;
  onSelect: (optionIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  answered: boolean;
  result: boolean | null;
  decrypting: boolean;
  zamaLoading: boolean;
};

const OPTION_LABELS = ['A', 'B'];

export function QuestionCard({
  questionId,
  prompt,
  options,
  reward,
  selectedOption,
  onSelect,
  onSubmit,
  isSubmitting,
  answered,
  result,
  decrypting,
  zamaLoading,
}: QuestionCardProps) {
  const disableInteractions = answered || isSubmitting || zamaLoading;

  let statusMessage = 'Choose an option and submit it encrypted.';
  let statusTone: 'neutral' | 'positive' | 'negative' = 'neutral';

  if (answered) {
    if (decrypting) {
      statusMessage = 'Decrypting your result...';
    } else if (result === true) {
      statusMessage = 'You cracked it! Points added to your encrypted score.';
      statusTone = 'positive';
    } else if (result === false) {
      statusMessage = 'Not quite right this time. Score unchanged.';
      statusTone = 'negative';
    } else {
      statusMessage = 'Result stored encrypted. Decrypt your score to reveal it.';
    }
  } else if (zamaLoading) {
    statusMessage = 'Initialising encryption service...';
  }

  return (
    <article className="question-card">
      <header className="question-card__header">
        <span className="question-card__label">Question {questionId + 1}</span>
        <span className="question-card__reward">+{reward} pts</span>
      </header>

      <p className="question-card__prompt">{prompt}</p>

      <div className="question-card__options">
        {options.map((option, index) => {
          const classes = ['question-card__option'];
          if (selectedOption === index) {
            classes.push('question-card__option--selected');
          }
          if (answered) {
            classes.push('question-card__option--locked');
          }

          return (
            <button
              key={option}
              type="button"
              className={classes.join(' ')}
              onClick={() => !disableInteractions && onSelect(index)}
              disabled={disableInteractions}
            >
              <span className="question-card__option-index">{OPTION_LABELS[index]}</span>
              <span className="question-card__option-text">{option}</span>
            </button>
          );
        })}
      </div>

      <footer className="question-card__footer">
        <p
          className={[
            'question-card__status',
            statusTone === 'positive' ? 'question-card__status--positive' : '',
            statusTone === 'negative' ? 'question-card__status--negative' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusMessage}
        </p>

        <button
          type="button"
          className="question-card__submit"
          onClick={onSubmit}
          disabled={
            answered ||
            zamaLoading ||
            isSubmitting ||
            selectedOption === null
          }
        >
          {zamaLoading ? 'Preparing encryption...' : isSubmitting ? 'Sending answer...' : answered ? 'Answered' : 'Submit encrypted answer'}
        </button>
      </footer>
    </article>
  );
}
