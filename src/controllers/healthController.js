const healthCheck = async(req, res)=>{
  res.status(200).json({
    status: 'OK',
    message: "TaskFlow API is running"
  })
}
module.exports={healthCheck};