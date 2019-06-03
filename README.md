# Spaced repetition API!

This is the server side for the spaced repetition project by Laurel Butler and Enrique Montemayor and utilizes Express and PostgresSQL. 

## API Documentation

### GET /api/language
Returns data for the current user. Returns "language" with keys of "id", "name," "total_score", "user_id", and "head." The name is the name of the language, "head" points to the head of the linked list of words for the user to practice. Total score is the number of correct answers the user has made.

Also returns "words" with a list of the users words, each having the keys "id", "original," "translation," "memory_value", "correct_count", "incorrect_count", "language_id", and "next."

"Memory value" is used to ensure that words that have been answered correctly multiple times are tested less frequently, while the correct and incorrect counts are the number of times the user has guessed correctly or incorrectly. "Next" points to the next word on the linked list.

### GET /api/language/head
Returns the next word the user will be tested on. Contains the keys:

Response contains the following:
 nextWord: the untranslated word the user will be tested on,
 wordCorrectCount: number of user's correct attempts on respective word, 
 wordIncorrectCount:number of user's incorrect attempts on respective word, 
 totalScore: user's total correct answers for all words in that

### POST /api/language/guess
Request body for this route requires a key, "guess",  whose value is the user's guess for the word in question

Response contains the following:
answer: correct translation of word the user attempted a guess on
isCorrect: returns true or false depending on the user's answer
nextWord: next untranslated word to be tested
wordCorrectCount: number of user's correct attempts on respective word, 
wordIncorrectCount:number of user's incorrect attempts on respective word, 
totalScore: user's total correct answers for all words in that


## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests mode `npm test`

Run the migrations up `npm run migrate`

Run the migrations down `npm run migrate -- 0`
