const express = require("express")
const router = new express.Router()
const auth = require("../middleware/auth")
const Task = require("../models/task.js")

//Creating Task of an user
router.post("/tasks" ,auth,async (req,res)=>{
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)

    }
    catch(error){
        res.status(400).send(error)
    }
})

//Reading all task of an user
router.get("/tasks" ,auth, async (req,res)=>{
    const match ={}
    const sort={}
    if (req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    try{
        // const tasks = await Task.find({owner : req.user._id})
        await req.user.populate({
            path:"tasks",
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.status(201).send(req.user.tasks)
    }
    catch(e){
        res.status(500).send(error)
    }
})

//Reading a particular task of an user
router.get("/tasks/:id",auth,async (req,res)=>{
    const _id = req.params.id 
    try{
        const task = await Task.findOne({_id, owner : req.user._id})
        if(!task){
            res.status(404).send()
        }
        res.send(task)
    }
    catch(error){
        res.status(500).send()
    }
})

//Updating a patricular task of an user
router.patch("/tasks/:id",auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description","completed"]
    const isValid = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValid){
        return res.status(400).send({error : "Invalid Updates"})
    }

    try{
        const task = await Task.findOne({_id:req.params.id, owner : req.user._id})
        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update)=>task[update]=req.body[update])
        await task.save()
        res.send(task)
    }
    catch(e){
        res.status(505).send()
    }
})

//Deleting a task by id for a particular user
router.delete("/tasks/:id" ,auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id, owner : req.user._id})
        if(!task){
            return res.status(404).send({error : "Id not found"})
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router