import type { FAQItem } from './tfidf';

export interface FAQ extends FAQItem {}

export const faqs: FAQ[] = [
  {
    id: 1,
    question: 'How do I apply for admission?',
    answer:
      'Apply through the college admission portal, complete the application form, upload the required documents, and pay the application fee.',
  },
  {
    id: 2,
    question: 'What documents are required for admission?',
    answer:
      'Previous academic mark sheets, transfer certificate, ID proof, passport-size photographs, and category certificate if applicable.',
  },
  {
    id: 3,
    question: 'What courses does the college offer?',
    answer:
      'Undergraduate and postgraduate programmes across arts, science, commerce, management, and technology.',
  },
  {
    id: 4,
    question: 'What is the eligibility criteria for admission?',
    answer:
      'Most undergraduate programmes require Class 12 completion, while postgraduate programmes generally require a relevant bachelor’s degree.',
  },
  {
    id: 5,
    question: 'How can I pay my college fees?',
    answer:
      'Fees can be paid through the student portal using UPI, net banking, debit card, credit card, or other approved methods.',
  },
  {
    id: 6,
    question: 'Does the college provide scholarships?',
    answer: 'Merit-based, need-based, and government scholarship options may be available.',
  },
  {
    id: 7,
    question: 'Where can I find the class timetable?',
    answer: 'The class timetable is available on the student portal and department notice board.',
  },
  {
    id: 8,
    question: 'Is hostel accommodation available?',
    answer:
      'Hostel accommodation may be available subject to room availability after admission confirmation.',
  },
  {
    id: 9,
    question: 'Does the college have a library?',
    answer: 'Yes. The library provides textbooks, journals, reference materials, and digital resources.',
  },
  {
    id: 10,
    question: 'How do I get my examination admit card?',
    answer: 'Download it from the student or examination portal after your exam form and fees are approved.',
  },
  {
    id: 11,
    question: 'When are examination results announced?',
    answer: 'Results are published on the university or college examination portal after evaluation.',
  },
  {
    id: 12,
    question: 'Are placement and internship opportunities available?',
    answer:
      'The placement cell offers career guidance, internship opportunities, training, and recruitment drives.',
  },
];
