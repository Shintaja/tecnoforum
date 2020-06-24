const commentRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Comments = require('../models/comment')
const User = require('../models/user')
const Category = require('../models/category')
const Thread = require('../models/thread')
const { response } = require('../app')
const logger = require('../utils/logger')
//const { ConnectionStates } = require('mongoose') // mistä tämä tuli ?

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if(authorization && authorization.toLowerCase().startsWith('basic ')) {
        return authorization.substring(6)
      }
    else if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
      return authorization.substring(7)
    }
    return null
  }

commentRouter.get('/api/comments', (request, response,next) => {
    
    Comments
        .find({})
        .then(comment => {
            response.json(comment.map(p => p.toJSON()))
        })
        .catch(error => next(error))
  })

  
  commentRouter.get('/api/comments/:id', (request, response, next) => {
      Comments
        .findById(request.params.id)
        .then(comment =>{
            //console.log(`comment ${comment} with id ${request.params.id}`)
            if(comment) response.json(comment.toJSON())
            else response.json(`no comment found with id ${request.params.id}`)
        })
        .catch(error => next(error))
})

  commentRouter.post('/api/comments', async (request, response,next) => {
    
    const body = request.body  
    const token = getTokenFrom(request)
 
    try{
      const decodedToken = jwt.verify(token, process.env.SECRET)
      
        if (!token || !decodedToken.id) {
          return response.status(401).json({ error: 'token missing or invalid' })
      }
      const user = await User.findById(decodedToken.id)
  
      const thread = await Thread.findOne({threadName: body.threadName})
      if(!thread) 
        return response.status(401).json({error: `thread ${body.threadName} does not exist`})
      
      const comment = new Comments({
        thread_id: thread._id,
        comment: body.comment,
        author: user.fullname,
        user_id: user._id,
        date: new Date()
        
      })
    
      const savedComment = await comment.save()
      
      user.comments = user.comments.concat(savedComment._id)
      await user.save()
      // tallenna myös Threadiin
      thread.comments = thread.comments.concat(savedComment._id)
      await thread.save()
      
      response.json(savedComment.toJSON())

    }catch(error) {
      logger.error(error)
      return response.status(401).json({ error: error.name})
    } 
})    

commentRouter.delete('/api/comments/:id', async (request, response, next) => {
    
  const body = request.body  
  const token = getTokenFrom(request)
  
  // tarkista olenko admin tai käyttäjä itse
  try{
      console.log('token: ', token)
      const decodedToken = jwt.verify(token, process.env.SECRET)
      console.log('decodetToken: ', decodedToken)
      
        if (!token || !decodedToken.id) {
          return response.status(401).json({ error: 'token missing or invalid' })
      }
      const user = await User.findById(decodedToken.id)
      console.log("admin user ", user.userType)
      if(user.userType !== "admin") {
          return response.status(401).json({ error: 'unauthorized admin delete operation'})
      }

      // poista comment, päivitä user ja thread, category modelit vai löytyiskö
      // automaattisesti kun modeliin linkitetty - tutki Populate ?!
        /* Delete the reference: you can do an update with $pull (the value to pull would be the resume's _id):

        Assuming that `resume.user` is *not* populated
        await User.update({ _id: resume.user }, { $pull: { resumes: resume._id } })
        ..or get the user, remove the corresponding entry in resumes, save the user.*/
        //https://stackoverflow.com/questions/61297292/how-do-i-delete-an-item-from-a-schema-which-is-an-array-of-objects-in-mongoose

      await Comments.findByIdAndRemove(request.params.id) 
        if(response) {
          console.log('find and deleted, user data not updated yet')

          response.status(204).end()
        }
      
      } catch (exception) {
        // tulee DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#findandmodif
        next(exception)
      }
})

  module.exports = commentRouter