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

    //============= validate the req body fields ==================
    if (!guess) {     
      return res.status(400).send({error: `Missing 'guess' in request body`});
    }



    //============== implement a new LL =======================
      let sll = new LinkedList()
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id, 
      )
    
     for(let i=0; i<words.length; i++){
       sll.insertLast(words[i])
     }

     let listHead = sll.head.value
     console.log(listHead, "<-listHead right after dec")






     let totalScore = await LanguageService.getTotalScore(
      req.app.get('db'),
      req.user.id
    );
      totalScore = totalScore[0].total_score

     







      let response = {}

    if(guess === listHead.translation){  
      
           
      response.wordIncorrectCount = listHead.incorrect_count
      response.wordCorrectCount = listHead.correct_count  += 1
      response.memory_value = listHead.memory_value *=2
      response.totalScore = totalScore + 1
      response.answer = listHead.translation
      response.isCorrect=true
      
      let oldHead = sll.head;
      
      sll.remove(sll.head)
        
      response.nextWord= sll.head.value.original
    

      sll.insertAt(oldHead.value.memory_value, oldHead.value)


      ListService.displayList(sll)



      let changes = {
        total_score: response.totalScore,
        head:sll.head.value.id
      }
      
      let wordChanges={
        memory_value : response.memory_value,
        incorrect_count: response.wordIncorrectCount
      }
      console.log(changes, wordChanges)

      //  await LanguageService.updateLanguageTable(
      //   req.app.get('db'),
      //   req.user.id,
      //   changes
      // );


      // await LanguageService.updateWordTable(
      //   req.app.get('db'),
      //   req.language.id, 
      // )

 
      
      return res.status(200).json(response)

 
    } else{
      console.log('=======if incorrect===========' )

   
      
      response.wordIncorrectCount = listHead.incorrect_count += 1
      response.wordCorrectCount = listHead.correct_count
      response.memory_value = 1
      response.totalScore = totalScore
      response.answer = listHead.translation
      response.isCorrect=false
      
      let oldHead = sll.head;
      sll.remove(sll.head)
  
      response.nextWord=sll.head.value.original
  
      sll.insertAt(oldHead.value.memory_value, oldHead.value)

     
      let changes = {
        total_score: response.totalScore,
        head:sll.head.value.id
      }
      
      let wordChanges={
        memory_value : response.memory_value,
        incorrect_count: response.wordIncorrectCount
      }
      console.log(changes, wordChanges)

      //  await LanguageService.updateLanguageTable(
      //   req.app.get('db'),
      //   req.user.id,
      //   changes
      // );


      // await LanguageService.updateWordTable(
      //   req.app.get('db'),
      //   req.language.id, 
           //wordChanges
      // )

    
        

     
      return res.status(200).json(response)
      


      
      

    }
  
   
  })

module.exports = languageRouter
