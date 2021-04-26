const express = require('express')
const Article = require('./../models/article')
const router = express.Router()
const auth = require('../middleware/auth')


router.get('/new', auth.authcheck,(req, res) => {
  console.log("article new khul gaya")
  res.render('articles/new', { article: new Article() })
})

router.get('/edit/:id',auth.authcheck, async (req, res) => {
  console.log("article edit is opening")
  const article = await Article.findById(req.params.id)
  //article.title = req.body.title
  //article.description = req.body.description
  //article.markdown = req.body.markdown
 // await article.save()
  res.render('articles/edit', { article: article })
})

router.get('/:slug',auth.authcheck, async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug }).populate('owner')
  if (article == null) res.redirect('/all')
  res.render('articles/show', { article: article })
})

router.post('/',auth.authcheck, async (req, res, next) => {
  console.log("into post /articles")
  const article = new Article()
  article.title = req.body.title
  article.description = req.body.description
  article.target = req.body.target
  article.owner = req.session.userid
  console.log("article value is "+ article)
  try {
      const n_article = await article.save()
      console.log("article saved ")
      res.redirect(`/articles/${n_article.slug}`)
    } catch (e) {
      res.render(`articles/new`, { article: new Article() })
    }
  //saveArticleAndRedirect('new')
  //next()
  //console.log("after next of post /articles")
})

router.put('/:id',auth.authcheck, async (req, res, next) => {
  req.article = await Article.findById(req.params.id)
  next()
}, saveArticleAndRedirect('edit'))

router.delete('/:id',auth.authcheck, async (req, res) => {
  await Article.findByIdAndDelete(req.params.id)
  res.redirect('/all')
})

function saveArticleAndRedirect(path) {
  console.log("inside save article function")
  return async (req, res) => {
    let article = req.article
    article.title = req.body.title
    article.description = req.body.description
    article.target = req.body.target
    console.log("article value is "+ article)
    try {
      article = await article.save()
      console.log("article saved ")
      res.redirect(`/articles/${article.slug}`)
    } catch (e) {
      res.render(`articles/${path}`, { article: article })
    }
  }
}

module.exports = router