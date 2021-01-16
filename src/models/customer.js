import mongoose, { Schema } from 'mongoose';

const CustomerSchema = new Schema({
  name: String,
  contactNumber: String,
  address: String,
  advancedPayment : Number,
  extra : [String],
  publishedDate : {
    type : Date,
    default : Date.now,
  },
  user: {
    _id: mongoose.Types.ObjectId,
    username: String,
  },
});


// 스키마를 통한 모델 생성입니다.
const Customer = mongoose.model('Customer', CustomerSchema);
export default Customer;
