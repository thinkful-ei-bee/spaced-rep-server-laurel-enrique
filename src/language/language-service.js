const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score',
      )
      .where('language.user_id', user_id)
      .first()
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id })
   
  },

  getWordById(db, id) {
    return db 
      .from('word')
      .select('*')
      .where({ id });
  },

  updateWord(db, id, wordChanges) {
    return db
      .from('word')
      .where({id} )
      .update(wordChanges)
  },


  updateLanguageTable(db,id , changes){
    return db
      .from ('language')
      .where({id})
      .update({
        total_score: changes.total_score,
        head: changes.head
      })
     
  },

  getHeadWord(db, languageId) {
    return db
      .from('word')
      .select('word.*')

      .join('language', 'language.head', '=', 'word.id')
      .where({ 'language_id': languageId });

  },


  getTotalScore(db, userId) {
    return db
      .from('language')
      .select('total_score')
      .where({'language.user_id': userId })
  },



}



module.exports = LanguageService
