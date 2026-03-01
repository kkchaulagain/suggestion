

const express=require('express');
const mongoose=require('mongoose');
const {FormResponse} =require('../models/FormResponse');
const {FeedbackForm}= require('../models/FeedbackForm');
const router =express.Router();
router.post('/',async (req:any,res:any)=>
{
    try {
        const {formId,answers}=req.body;
        //is form valid

        if(!mongoose.Types.ObjectId.isValid(formId))
        {
                return res.status(400).json({error:'Invalid form Id'});
        }

        //if form exist in DB
        const form =await FeedbackForm.findById(formId);
        if(!form)
        {
            return res.status(404).json({error:'Feedback form not found'});
        }
        //if answers are valid
          if(!Array.isArray(answers)||answers.length===0)
          {
            return res.status(400).json({error:'At least one answer is required'});
          }

          const formResponse=await FormResponse.create({formId,answers});
          return res.status(201).json({
            message:"Form submitted successfully",
            formResponse,
          });
    } catch (error:any) {
            //checking if the response is what schema accepts
        if(error.name==='ValidationError') {
               return res.status(400).json({error:error.message})
    }
    return res.status(500).json({error:'Failed to submit form response'});

}
})

router.get('/:formId',async(req:any,res:any)=>
{
  try {
    //is formId valid
    const isValid=mongoose.Types.ObjectId.isValid(req.params.formId)
    if(!isValid)
    {
      return res.status(400).json({error:'Invalid form Id',success:false});
    }
    //does that form exists in DB
    const doesExists= await FeedbackForm.findById(req.params.formId)
    if(!doesExists)
    {
      return res.status(404).json({error:'form Is Not found',success:false})
    }
    const responses= await FormResponse.find({formId:req.params.formId})
    {
      return res.status(200).json({ message: 'Form responses fetched successfully', success: true, responses })
    }
  } catch (error:any) {
    return res.status(500).json({error:"Failed to fetch form Responses",success:false})
  }
})
module.exports=router;