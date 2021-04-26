const mongoose = require('mongoose')
const marked = require('marked')
const slugify = require('slugify')
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  target: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  slug: {
    type: String,
   //required: true,
    unique: true
  },
  sanitizedHtml: {
    type: String,
    //required: true
  },
  owner : {
    type:mongoose.Schema.Types.ObjectId,
    //required:true,
    ref : 'Users'   //owner acts as a foreign key attribute from document(table) Users. SInce it is refferenced now using populate method we can bring the entire User doc into task doc 
}
})

articleSchema.pre('validate', function(next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true })
  }

  // if (this.markdown) {
  //   this.sanitizedHtml = dompurify.sanitize(marked(this.markdown))
  // }
  console.log("pre validate done")
  console.log(this.slug)
  next() 
})

module.exports = mongoose.model('Article', articleSchema)