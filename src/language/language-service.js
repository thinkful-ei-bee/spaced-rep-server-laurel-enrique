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

  updateLanguageTable(db,user_id , changes){
    return db
      .from ('language')
      .where('language.user_id', user_id)
      .update({
        total_score: changes.total_score,
        head: changes.head
      })
     
  },

  getHeadWord(db, userId) {
    return db
      .from('word')
      .select(
        'original',
        'correct_count',
        'incorrect_count',
        'translation',
        'memory_value',
        'next',
        'language_id'
        )
      .join('language', 'language.id', '=', 'word.language_id') // in the case the user has multiple languages
      .where({ 'language.user_id': userId }) //in the case there are multiple users
      .where('word.id', '=', db.raw('language.head'))

  },


  getTotalScore(db, userId) {
    return db
      .from('language')
      .select('total_score')
      .where({'language.user_id': userId })
  },
  updateTotalScore(db, userId, score) {
    return db
      .from('language')
      .select('total_score')
      .where({'language.user_id': userId })
      .update({total_score:score})
  },


}



module.exports = LanguageService