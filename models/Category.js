import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
