const contractAddress = import.meta.env.VITE_ENCRYPTED_QUIZ_ADDRESS;

if (!contractAddress) {
  console.warn('VITE_ENCRYPTED_QUIZ_ADDRESS is not set. The quiz will not be able to submit answers.');
}

export const QUIZ_ADDRESS = (contractAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const QUIZ_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'questionId', type: 'uint256' },
      { indexed: false, internalType: 'ebool', name: 'isCorrect', type: 'bytes32' },
      { indexed: false, internalType: 'euint32', name: 'newScore', type: 'bytes32' },
    ],
    name: 'AnswerSubmitted',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'questionId', type: 'uint256' },
    ],
    name: 'getEncryptedResult',
    outputs: [{ internalType: 'ebool', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getEncryptedScore',
    outputs: [{ internalType: 'euint32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'questionId', type: 'uint256' }],
    name: 'getQuestion',
    outputs: [
      { internalType: 'string', name: 'prompt', type: 'string' },
      { internalType: 'string', name: 'optionOne', type: 'string' },
      { internalType: 'string', name: 'optionTwo', type: 'string' },
      { internalType: 'uint32', name: 'rewardPoints', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'questionId', type: 'uint256' },
    ],
    name: 'hasAnswered',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'questionId', type: 'uint256' },
      { internalType: 'externalEuint32', name: 'answerHandle', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'submitAnswer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalQuestions',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const;
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getKYCStatus",
    "outputs": [
      {
        "internalType": "enum ZamaKYC.KYCStatus",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingKYCCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasKYCRecord",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "isKYCVerified",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "registeredUsers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "rejectKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_identityDocumentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "externalEuint32",
        "name": "_nationality",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "_birthYear",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "submitKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "verifyKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
