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
  
       
       
    
      let isCorrect;
    
      let response = {
        
      }

      console.log(guess, sll.head.value.translation)
      console.log(sll.head)
     
    if(guess === sll.head.value.translation){  
        
          
        // console.log('+++++++++++++++++LIST BEFORE WITH CORRECT ANSWER ++++++++++++++++++++++')
        // ListService.displayList(sll)

      
      isCorrect =true
      
      let oldHead = sll.head.value;

      sll.insertAt(oldHead.memory_value*2, oldHead)
      
      sll.remove(sll.head)
        
      let newHead= sll.head.value




      let newNext =  sll.find(oldHead)

      newNext= newNext.next.value.id
      
      oldHead.next = newNext
     
      let prevWord= ListService.findPrevious(sll, oldHead)

      prevWord= prevWord.value
    
      prevWord.next= oldHead.id

      prevId=prevWord.id

    

  
      // console.log('+++++++++++++++LIST AFTER++++++++++++++++++++++++')
      // ListService.displayList(sll)
      
       await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        {
          total_score:Number(totalScore+1),
          head:newHead.id
        }
      );

      await LanguageService.updateWord(
        req.app.get('db'),
        oldHead.id,
        {

          memory_value : Number(oldHead.memory_value*2),
          correct_count: Number(oldHead.correct_count+1),
          next: oldHead.next
        }
      )
      await LanguageService.updatePrevious(
        req.app.get('db'),
        prevId,
        {
          next: prevWord.next,
        }
      )

       response = {
        nextWord:newHead.original,
        answer: oldHead.translation,
        isCorrect,
        totalScore:Number(totalScore+1),
        wordCorrectCount:newHead.correct_count,
        wordIncorrectCount:newHead.incorrect_count,
      }
      
      console.log(response,'<------- response if correct')

       res.status(200).json(response)
        next()
 
    } else{
      
     
      // console.log('------------LIST BEFORE WITH WRONG ANSWER ----------------')

      // ListService.displayList(sll)
      
      
   
      isCorrect=false

      let oldHead = sll.head.value;

      sll.remove(sll.head)

      
      let newHead= sll.head.value
      
      oldHead.next = newHead.next
      oldHead.incorrect_count+=1
      console.log(newHead,' is the new Head')

      newHead.next = oldHead.id
      sll.insertAt(1, oldHead)

      let prevWord= newHead

      prevWord.next= oldHead.id

      prevId=prevWord.id

  


      // console.log('---------------LIST AFTER-------------------')
      // ListService.displayList(sll)


       await LanguageService.updateLanguageTable(
        req.app.get('db'),
        req.user.id,
        {
          head:newHead.id
        }
      );



      await LanguageService.updateWord(
        req.app.get('db'),
          oldHead.id,
          {
            memory_value : 1,
            incorrect_count: oldHead.incorrect_count,
            next: oldHead.next,
          }
      )
      await LanguageService.updatePrevious(
        req.app.get('db'),
        prevId,
        {
          next: prevWord.next,
        }
      )

    
      response = {
        nextWord:newHead.original,
        wordCorrectCount:newHead.correct_count,
        wordIncorrectCount:newHead.incorrect_count,
        answer: oldHead.translation,
        isCorrect,
        totalScore:totalScore
      }

     
       res.status(200).json(response)
      

        next()
      
      

    }
  } catch (error) {
    next(error)
  }
  
   
  })

module.exports = languageRouter
