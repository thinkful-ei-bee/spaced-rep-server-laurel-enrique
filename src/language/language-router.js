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

    try{
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

     
     
     
     
     let totalScore = await LanguageService.getTotalScore(
       req.app.get('db'),
       req.user.id
       );
       totalScore = totalScore[0].total_score
       
       
       
       let listHead = sll.head.value
       let nextWord=sll.head.next.value



      let response = {
        nextWord:nextWord.original,
        wordCorrectCount:nextWord.correct_count,
        wordIncorrectCount:nextWord.incorrect_count,
        answer: listHead.translation,
        totalScore:totalScore,
      }

      console.log(guess===listHead.translation,'---------------')
     
    if(guess === listHead.translation){  
        
        //================ if Correct ==================    
           
      
      response.totalScore = Number(totalScore+= 1)
      response.isCorrect=true
      
      let oldHead = sll.head;

      
      sll.remove(sll.head)
        
    
      sll.insertAt(oldHead.value.memory_value, oldHead.value)



      let newNext =  sll.find(oldHead.value)
      newNext= newNext.next.value.id
     

      let prevId= ListService.findPrevious(sll, oldHead.value)
      prevId=prevId.value.id

      console.log(prevId,'<<<<<<<< prevId')


      let wordChanges={
        memory_value : oldHead.value.memory_value *2,
        correct_count: oldHead.value.correct_count+1,
        next: newNext
      }
      
      let changes = {
        total_score: totalScore+1,
        head:sll.head.value.id
      }
      console.log(changes, wordChanges)

      let prevChanges={
     
        next: oldHead.value.id,
      }

      
       await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        changes
      );

      await LanguageService.updateWord(
        req.app.get('db'),
        oldHead.value.id,
        wordChanges
      )
      await LanguageService.updatePrevious(
        req.app.get('db'),
        prevId,
        prevChanges
      )

    
 
      
       res.status(200).json(response)
        next()
 
    } else{
      //================ if Incorrect ==================    
     

   
      
      
      response.isCorrect=false
      


      let oldHead = sll.head;
      sll.remove(sll.head)
  
  
      sll.insertAt(oldHead.value.memory_value, oldHead.value)

    
    
    

      let prevId= ListService.findPrevious(sll, oldHead.value)
      prevId=prevId.value.id

      console.log(prevId,'<<<<<<<< prevId')



      let changes = {
       
        head:sll.head.value.id
      }
      
      let wordChanges={
        memory_value : 1,
        incorrect_count: oldHead.value.incorrect_count+1,
        next: oldHead.value.id,
      }

      let prevChanges={
     
        next: oldHead.value.id,
      }








       await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        changes
      );


       

      await LanguageService.updateWord(
        req.app.get('db'),
          oldHead.value.id,
           wordChanges
      )
      await LanguageService.updatePrevious(
        req.app.get('db'),
         prevId,
           prevChanges
      )

    
        

     
       res.status(200).json(response)
      

        next()
      
      

    }
  } catch (error) {
    next(error)
  }
  
   
  })

module.exports = languageRouter
