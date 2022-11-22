/* eslint-disable no-prototype-builtins */
import mongoose from 'mongoose';

import Form from '../models/Form.js';

class QuestionController {
  async getQuestionByUserId(req, res) {
    try {
      const { formId } = req.params;
      const { id: owner } = req.user;

      const form = await Form.findOne({ _id: formId, owner });
      if (!form) throw { code: 404, message: 'FORM_NOT_FOUND' };
      const { questions } = form;

      return res.json({
        status: 'success',
        data: {
          questions,
        },
      });
    } catch (error) {
      return res
        .status(error.code || 500)
        .json({
          status: error.code ? 'fail' : 'error',
          message: error.message || 'Terjadi kegagalan pada server',
        });
    }
  }

  async addQuestion(req, res) {
    try {
      const { formId } = req.params;
      const { id: owner } = req.user;
      const { question, type, required } = req.body;

      if (!mongoose.Types.ObjectId.isValid(formId)) throw { code: 404, message: 'FORM_NOT_FOUND' };

      const newQuestion = {
        id: mongoose.Types.ObjectId(),
        question: question || null,
        type: type || 'text', /* text, radio, checkbox, dropdown */
        required: required || false,
        options: [],
      };

      const form = await Form.findOneAndUpdate(
        { _id: formId, owner },
        { $push: { questions: newQuestion } },
        { new: true },
      );

      if (!form) throw { code: 404, message: 'FORM_NOT_FOUND' };

      return res.status(201).json({
        status: 'success',
        message: 'QUESTION_ADDED',
        data: {
          addedQuestion: newQuestion,
        },
      });
    } catch (error) {
      return res
        .status(error.code || 500)
        .json({
          status: error.code ? 'fail' : 'error',
          message: error.message || 'Terjadi kegagalan pada server',
        });
    }
  }

  async updateQuestion(req, res) {
    try {
      const { formId, questionId } = req.params;
      const { id: owner } = req.user;
      const { question, type, required } = req.body;
      const allowedTypes = ['text', 'radio', 'checkbox', 'dropdown', 'email'];

      if (!mongoose.Types.ObjectId.isValid(formId)) throw { code: 404, message: 'FORM_NOT_FOUND' };
      if (!mongoose.Types.ObjectId.isValid(questionId)) throw { code: 404, message: 'QUESTION_NOT_FOUND' };

      const field = {};
      if (req.body.hasOwnProperty('question')) {
        field['questions.$[indexQuestion].question'] = question;
      } else if (req.body.hasOwnProperty('type')) {
        if (!allowedTypes.includes(type)) throw { code: 400, message: 'INVALID_QUESTION_TYPE' };
        field['questions.$[indexQuestion].type'] = type;
      } else if (req.body.hasOwnProperty('required')) {
        field['questions.$[indexQuestion].required'] = required;
      }

      const form = await Form.findOneAndUpdate(
        { _id: formId, owner },
        { $set: field },
        {
          arrayFilters: [{ 'indexQuestion.id': mongoose.Types.ObjectId(questionId) }],
          new: true,
        },
      );

      if (!form) throw { code: 404, message: 'FORM_NOT_FOUND' };

      return res.json({
        status: 'success',
        message: 'QUESTION_UPDATED',
        data: {
          form,
        },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(error.code || 500)
        .json({
          status: error.code ? 'fail' : 'error',
          message: error.message || 'Terjadi kegagalan pada server',
        });
    }
  }

  async deleteQuestion(req, res) {
    try {
      const { formId, questionId } = req.params;
      const { id: owner } = req.user;

      if (!mongoose.Types.ObjectId.isValid(formId)) throw { code: 404, message: 'FORM_NOT_FOUND' };
      if (!mongoose.Types.ObjectId.isValid(questionId)) throw { code: 404, message: 'QUESTION_NOT_FOUND' };

      const form = await Form.findOneAndUpdate(
        { _id: formId, owner },
        { $pull: { questions: { id: mongoose.Types.ObjectId(questionId) } } },
        { new: true },
      );

      if (!form) throw { code: 404, message: 'FORM_NOT_FOUND' };

      return res.json({
        status: 'success',
        message: 'QUESTION_DELETED',
        data: {
          form,
        },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(error.code || 500)
        .json({
          status: error.code ? 'fail' : 'error',
          message: error.message || 'Terjadi kegagalan pada server',
        });
    }
  }
}

export default QuestionController;