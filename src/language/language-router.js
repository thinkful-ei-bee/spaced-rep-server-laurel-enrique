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

    let guess = req.body.guess

    try {
   
    if (!guess) {     
      return res.status(400).send({error: `Missing 'guess' in request body`});
    }

   

    let headWord = await LanguageService.getHeadWord(
      req.app.get('db'), 
        req.language.id,
    )
    headWord=await headWord;
    headWord=headWord[0];
    console.log('headword:', headWord)



     let totalScore = await LanguageService.getTotalScore(
       req.app.get('db'),
       req.user.id
       );
      totalScore = await totalScore;
      totalScore = totalScore[0].total_score
  
       
    let resObj = {

      answer:headWord.translation
    }  
    
    
    
     

     
    if(guess === headWord.translation){  
        
      resObj.isCorrect=true
      resObj.totalScore= totalScore += 1;

      headWord.memory_value *= 2;
      headWord.correct_count += 1;

    } else{
      resObj.isCorrect=false;
      resObj.totalScore = totalScore;

      headWord.memory_value = 1;
      headWord.incorrect_count += 1;
    }
      


   
    let nextHead= headWord.next;

    let prevWord = headWord;

    
    for (let i = 0; i < headWord.memory_value; i++) {
      if (!prevWord.next) {
        break;
      }

      prevWord = await LanguageService.getWordById(
        req.app.get('db'),
        prevWord.next
      );
      prevWord = prevWord[0];
    }
    headWord.next = prevWord.next;
    prevWord.next = headWord.id;
    
      



    await LanguageService.updateWord(
      req.app.get('db'),
      headWord.id,
      {
        memory_value : headWord.memory_value,
        correct_count: headWord.correct_count,
        incorrect_count:headWord.incorrect_count,
        next: headWord.next
      }
    );
    await LanguageService.updateWord(
      req.app.get('db'),
      prevWord.id,
      {
        next: headWord.id,
      }
    )

      await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        {
          total_score:Number(resObj.totalScore),
          head:nextHead
        }
      );


      let newHead = await LanguageService.getHeadWord(
        req.app.get('db'),
        req.user.id
      )
      newHead= await newHead
      
      newHead = newHead[0]



       response = {
        nextWord:newHead.original,
        wordCorrectCount:newHead.correct_count,
        wordIncorrectCount:newHead.incorrect_count,
        answer:resObj.answer,
        isCorrect:resObj.isCorrect,
        totalScore:Number(resObj.totalScore),

      }
      
      

       res.status(200).json(response)
       
       next()
      } catch (error) {
        next(error)
      }
    })

module.exports = languageRouter
