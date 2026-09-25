# python FAQ Chatbot

## Task 2 Objective

Build an intelligent FAQ chatbot for **KITSW College** that answers student
questions about admissions, courses, fees, hostels, exams, and campus life.
The chatbot must use **NLP preprocessing**, **TF-IDF vectorization**, and
**cosine similarity** to match user questions to the closest FAQ — all running
entirely in the browser with no backend, no database, and no API keys.

---

## Features

- Polished single-page chatbot UI with a white chat card on a soft light-purple background
- Bot icon, "KITSW" title, and "College FAQ Assistant" subtitle
- Welcome message with three suggested-question buttons
- User messages on the right (purple), bot messages on the left (light purple)
- Typing indicator with animated dots
- Quick-topic chips for fast navigation (Admissions, Courses, Fees, Hostel, Exams, Placements)
- 12 college FAQs covering admissions, documents, courses, eligibility, fees,
  scholarships, timetable, hostel, library, admit cards, results, and placements
- **TF-IDF + cosine similarity** matching engine (implemented from scratch — no ML libraries)
- Matched FAQ question and similarity percentage shown below each bot answer
- Fallback message when similarity is below the 0.15 threshold
- Fully responsive — works on mobile and desktop

---

## NLP Preprocessing Steps

All user input and FAQ questions pass through a five-stage pipeline
(`src/nlp.ts`) before vectorization:

1. **Text Cleaning** — Convert to lowercase and remove all punctuation.
2. **Tokenization** — Split the cleaned text into individual words.
3. **Stop-word Removal** — Remove common filler words such as *the, is, a, an,
   how, do, I, can, to, for, what, where, when, why, does*, and more.
4. **Light Stemming** — Strip common suffixes (`-ing`, `-ed`, `-es`, `-s`) to
   normalize word forms (e.g., "applying" → "apply", "courses" → "course").
5. **Synonym Normalization** — Map college-domain synonyms to canonical terms:

   | Synonyms | Canonical Term |
   |---|---|
   | apply / application / admission | **admission** |
   | timetable / schedule / timings | **timetable** |
   | hostel / room / accommodation | **hostel** |
   | fees / fee / payment | **fees** |
   | placement / job / internship | **placement** |
   | exam / examination | **examination** |

---

## TF-IDF Explanation

**TF-IDF (Term Frequency–Inverse Document Frequency)** is a numerical
statistic that reflects how important a word is to a document within a
corpus.

- **Term Frequency (TF)** — How often a term appears in a document,
  divided by the total number of terms in that document.
- **Inverse Document Frequency (IDF)** — Measures how rare a term is
  across all documents. Common words get a low weight; rare words get a
  high weight. Formula: `IDF = log(N / DF) + 1` where *N* is the total
  number of documents and *DF* is the number of documents containing the
  term.
- **TF-IDF score** — `TF × IDF`. A term that appears frequently in one
  FAQ but rarely in others receives a high score, making it a strong
  discriminator.

Each FAQ question is converted into a TF-IDF vector (one number per
vocabulary term). The user's query is processed the same way and
converted into a query vector using the same vocabulary and IDF weights.

---

## Cosine Similarity Explanation

**Cosine similarity** measures the angle between two vectors, indicating
how similar they are regardless of magnitude.

Formula:

```
cosine(A, B) = (A · B) / (||A|| × ||B||)
```

- `A · B` is the dot product of the two vectors.
- `||A||` and `||B||` are the Euclidean magnitudes (lengths) of the vectors.

The result ranges from **0** (no shared terms) to **1** (identical
direction). The chatbot computes cosine similarity between the query
vector and every FAQ vector, then returns the FAQ with the highest
score. If the top score is **below 0.15**, the fallback message is shown.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| **React 18** | UI component framework |
| **TypeScript** | Type-safe language |
| **Tailwind CSS** | Utility-first styling |
| **Vite** | Build tool & dev server |
| **lucide-react** | Icon library |

No external NLP or ML libraries are used. TF-IDF and cosine similarity
are implemented manually in TypeScript (`src/tfidf.ts`, `src/nlp.ts`).

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Then open the URL shown in your terminal (typically
`http://localhost:5173`) in your browser.

### Other scripts

```bash
npm run build      # Production build
npm run preview    # Preview the production build
npm run typecheck  # TypeScript type checking
npm run lint       # Run ESLint
```

---

## Project Structure

```
src/
├── App.tsx        # Chatbot UI and message flow
├── faqs.ts        # 12 college FAQs (questions + answers)
├── nlp.ts         # NLP preprocessing pipeline
├── tfidf.ts       # TF-IDF vectorization + cosine similarity
├── types.ts       # Shared TypeScript interfaces
├── main.tsx       # React entry point
└── index.css      # Tailwind CSS imports
```
