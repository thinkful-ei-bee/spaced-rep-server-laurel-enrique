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

    
    if (!req.body.guess) {     //validate the req body fields
      return res.status(400).send({error: `Missing 'guess' in request body`});
    }


      let sll = new LinkedList()
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id, 
      )
    
     for(let i=0; i<words.length; i++){
       sll.insertLast(words[i])
     }





     
     let totalScore = await LanguageService.getTotalScore(
      req.app.get('db'),
      req.user.id
    );
      totalScore = totalScore[0].total_score

    if(req.body.guess === sll.head.value.translation){       
      
      ListService.updateCorrect(sll)
      let item = sll.head.value
      sll.remove(sll.head)
      sll.insertAt(item.memory_value, item)
      // ListService.displayList(sll)

      let changes = {
        total_score: totalScore+1,
        head:sll.head.value.id
      }


       await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        changes
      );


      let newScore = await LanguageService.getTotalScore(
        req.app.get('db'),
        req.user.id
      );

        newScore = newScore[0].total_score
        console.log(newScore, '<-------------------')
      response ={
        "nextWord": sll.head.value.original,
        "wordCorrectCount": sll.head.value.correct_count,
        "wordIncorrectCount": sll.head.value.incorrect_count,
        "totalScore": newScore,
        "answer": item.translation,
        "isCorrect": true
      }
      // console.log(response)
      return res.status(200).json(response)

 
    } else{
      

      // ListService.updateIncorrect(sll)
      let item = sll.head.value
      item.incorrect_count += 1
      item.memory_value = Number(1)
      sll.remove(sll.head)
      sll.insertAt(item.memory_value, item)
      // ListService.displayList(sll)

     
    
        

      response ={
        "nextWord": sll.head.value.original, //should it return just the word or the whole obj?
         "wordCorrectCount": sll.head.value.correct_count,
        "wordIncorrectCount": sll.head.value.incorrect_count,
        "totalScore":totalScore,
        "answer": item.translation,
        "isCorrect": false
      }
    //  console.log(response)
      return res.status(200).json(response)
      


      
      

    }
  
   
  })

module.exports = languageRouter