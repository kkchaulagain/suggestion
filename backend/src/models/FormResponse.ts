//what should be users submission
const mongoose=require('mongoose');

const answerSchema=new mongoose.Schema(
    {
        fieldName:
        {
            type:String,
            required:[true,'Field name is required'],
             match: [
             /^[a-zA-Z][a-zA-Z0-9_]*$/,
             'Field name must start with a letter and contain only letters, numbers, and underscores',
            ],
        },
        value:
        {
            type:mongoose.Schema.Types.Mixed, //field can hold any kind of data
            required:[true,'Answer must be written'],

        },
    },
    { _id:false}//mongo gives id but I don't want that
);
const formResponseSchema=new mongoose.Schema(
    {
        formId:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'FeedbackForm', //points to this model to get id
            required:[true,'Form Id is required'],
        },
        answers:
        {
            type:[answerSchema],
            required:[true,'Answers are required'],
            validate:
            {
                validator:(answers:any)=>Array.isArray(answers) && answers.length>0,
                message:'At least one answer is required',
            },
        },
    },
    {timestamps:true}
);
const FormResponse=mongoose.model('FormResponse',formResponseSchema);
module.exports={FormResponse}