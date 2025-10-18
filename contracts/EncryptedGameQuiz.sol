// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedQuiz
/// @notice Quiz game using Zama FHE to protect answers and scores
contract EncryptedGameQuiz is SepoliaConfig {
    struct Question {
        string prompt;
        string optionOne;
        string optionTwo;
    }

    uint256 private constant QUESTION_COUNT = 2;

    Question[QUESTION_COUNT] private _questions;
    euint32[QUESTION_COUNT] private _correctAnswers;
    euint32[QUESTION_COUNT] private _rewards;
    uint32[QUESTION_COUNT] private _plainRewards;

    mapping(address => euint32) private _scores;
    mapping(address => mapping(uint256 => bool)) private _answered;
    mapping(address => mapping(uint256 => ebool)) private _answerResults;

    event AnswerSubmitted(address indexed player, uint256 indexed questionId, ebool isCorrect, euint32 newScore);

    constructor() {
        _questions[0] = Question({
            prompt: "Which artifact protects the ancient forest?",
            optionOne: "The Whispering Stone",
            optionTwo: "The Ember Crown"
        });
        _questions[1] = Question({
            prompt: "Who forged the Crystal Blade?",
            optionOne: "Elder Myra",
            optionTwo: "Captain Solan"
        });

        _plainRewards[0] = 50;
        _plainRewards[1] = 50;

        _correctAnswers[0] = FHE.asEuint32(0);
        _correctAnswers[1] = FHE.asEuint32(1);
        _rewards[0] = FHE.asEuint32(_plainRewards[0]);
        _rewards[1] = FHE.asEuint32(_plainRewards[1]);

        FHE.allowThis(_correctAnswers[0]);
        FHE.allowThis(_correctAnswers[1]);
        FHE.allowThis(_rewards[0]);
        FHE.allowThis(_rewards[1]);
    }

    /// @notice Returns the total number of quiz questions
    function totalQuestions() external pure returns (uint256) {
        return QUESTION_COUNT;
    }

    /// @notice Fetches the public details of a question
    /// @param questionId The index of the question
    function getQuestion(uint256 questionId)
        external
        view
        returns (string memory prompt, string memory optionOne, string memory optionTwo, uint32 rewardPoints)
    {
        require(questionId < QUESTION_COUNT, "Invalid question");
        Question storage question = _questions[questionId];
        return (question.prompt, question.optionOne, question.optionTwo, _plainRewards[questionId]);
    }

    /// @notice Checks whether a player has already answered a question
    /// @param player The address of the player
    /// @param questionId The question identifier
    function hasAnswered(address player, uint256 questionId) external view returns (bool) {
        require(questionId < QUESTION_COUNT, "Invalid question");
        return _answered[player][questionId];
    }

    /// @notice Returns the encrypted score for a player
    /// @param player The address of the player
    function getEncryptedScore(address player) external view returns (euint32) {
        return _scores[player];
    }

    /// @notice Returns the encrypted result of a player's answer
    /// @param player The address of the player
    /// @param questionId The question identifier
    function getEncryptedResult(address player, uint256 questionId) external view returns (ebool) {
        require(questionId < QUESTION_COUNT, "Invalid question");
        return _answerResults[player][questionId];
    }

    /// @notice Submit an encrypted answer for a question
    /// @param questionId The question identifier
    /// @param answerHandle The encrypted answer handle
    /// @param inputProof The proof linked to the encrypted value
    function submitAnswer(uint256 questionId, externalEuint32 answerHandle, bytes calldata inputProof) external {
        require(questionId < QUESTION_COUNT, "Invalid question");
        require(!_answered[msg.sender][questionId], "Question already answered");

        euint32 encryptedAnswer = FHE.fromExternal(answerHandle, inputProof);
        euint32 correctAnswer = _correctAnswers[questionId];

        ebool isCorrect = FHE.eq(encryptedAnswer, correctAnswer);
        euint32 reward = _rewards[questionId];

        euint32 currentScore = _scores[msg.sender];
        if (!FHE.isInitialized(currentScore)) {
            currentScore = FHE.asEuint32(0);
        }
        euint32 incrementedScore = FHE.add(currentScore, reward);
        euint32 newScore = FHE.select(isCorrect, incrementedScore, currentScore);

        _scores[msg.sender] = newScore;
        _answerResults[msg.sender][questionId] = isCorrect;
        _answered[msg.sender][questionId] = true;

        FHE.allowThis(newScore);
        FHE.allow(newScore, msg.sender);
        FHE.allowThis(isCorrect);
        FHE.allow(isCorrect, msg.sender);

        emit AnswerSubmitted(msg.sender, questionId, isCorrect, newScore);
    }
}
