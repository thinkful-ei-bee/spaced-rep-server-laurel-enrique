const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonBodyParser= express.json()
const languageRouter = express.Router()
const LinkedList = require('../linked-list/list')
const ListService=require('../linked-list/list-service')

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

    
    if (!req.body.word) {     //validate the req body fields
      return res.status(400).send({error: `No input from client`});
    }
    
    let headWord  = await LanguageService.getHeadWord(
      req.app.get('db'), 
        req.user.id,
    )
    headWord=headWord[0]
     
    let correctTrans = headWord.translation



      let sll = new LinkedList()
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'), // uses language.id to get the items from word table
        req.language.id, //language.id comes from async function above
      )
     

     for(let i=0; i<words.length; i++){
       sll.insertLast(words[i])
     }
     
    
    if(req.body.word === correctTrans){       // check submitted answer by comparing it with the trans in DB

      
      ListService.updateCorrect(sll)
      let item = sll.head.value
      sll.remove(sll.head)
      sll.insertAt(item.memory_value, item)
      // ListService.displayList(sll)

      let totalScore = await LanguageService.updateTotalScore(
        req.app.get('db'),
        req.user.id
      );
     
      response ={
        "nextWord": sll.head.value,//should it return just the word or the whole obj?
        "wordCorrectCount": item.correct_count,
        "wordIncorrectCount": item.incorrect_count,
        "totalScore": totalScore[0].total_score,
        "answer": item.translation,
        "isCorrect": true
      }
   
      return response

      //update totalScore
      // update the word on the database 'persist'
    } else{
      console.log('answer was wrong')

      ListService.updateIncorrect(sll)
      let item = sll.head.value
      sll.remove(sll.head)
      sll.insertAt(item.memory_value, item)
      // ListService.displayList(sll)

      let totalScore = await LanguageService.getTotalScore(
        req.app.get('db'),
        req.user.id
      );
        

      response ={
        "nextWord": sll.head.value, //should it return just the word or the whole obj?
         "wordCorrectCount": item.correct_count,
        "wordIncorrectCount": item.incorrect_count,
        "totalScore":totalScore[0].total_score,
        "answer": item.translation,
        "isCorrect": false
      }
      // console.log(response)
      // return response
      


      
      // update the word on the database 'persist'

    }

   res.json(null)
  })

module.exports = languageRouter
