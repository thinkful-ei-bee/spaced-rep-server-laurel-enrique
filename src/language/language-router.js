const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonBodyParser= express.json()
const languageRouter = express.Router()

languageRouter
  .use(requireAuth) 
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'), // uses req.user.id to get the user's language from language table
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'), // uses language.id to get the items from word table
        req.language.id, //language.id comes from async function above
      )

      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })


languageRouter
  .get('/head', async (req, res, next) => {
    let word = await LanguageService.getHeadWord(
      req.app.get('db'), 
        req.user.id,
    )
    let totalScore = await LanguageService.getTotalScore(
      req.app.get('db'),
      req.user.id
    );

    word = word[0];
    totalScore = totalScore[0];

      const headWord = {
        nextWord: word.original,
        wordCorrectCount: word.correct_count,
        wordIncorrectCount: word.incorrect_count,
        totalScore: Number(totalScore.total_score)
    }

    return res.status(200).json(headWord);
  })

languageRouter
  .post('/guess', jsonBodyParser, async (req, res, next) => {

    //validate the req body fields
    if (!req.body.word) {
      return res.status(400).send({error: `No input from client`});
    }
    
    let correctWord  = await LanguageService.getHeadWord(
      req.app.get('db'), 
        req.user.id,
    )
      //TO-DO implement singly linked list
    let correctTrans = correctWord[0].translation

      // check submitted answer by comparing it with the trans in DB
    if(req.body.word === correctTrans){
       console.log('answer was correct')

      //update correct_count
      //update totalScore
      //shift word approprite amount of space (double the word's memory_value and move word back M places)
      // update the word on the database 'persist'
      //send a response with the fields for feedback as well as the next word to guess *look at examples from fixtures*
    } else{
      console.log('answer was wrong')

      //update incorrect_count
      //shift word approprite amount of space (reset the word's memory_value to 1 and move word back M places)
      // update the word on the database 'persist'
      //send a response with the fields for feedback as well as the next word to guess *look at examples from fixtures*

    }

   res.json(null)
  })

module.exports = languageRouter
