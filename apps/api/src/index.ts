import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

export interface SubSubHeading {
  id: string;
  title: string;
  content: string;
}

export interface SubHeading {
  id: string;
  title: string;
  content: string;
}

export interface Newspaper {
  id: string;
  brand: string;
  mainHeading: string;
  mainContent: string;
  subHeadings: [SubHeading, SubHeading];
  subSubHeadings: [SubSubHeading, SubSubHeading, SubSubHeading];
  createdAt: string;
}

let newspapers: Newspaper[] = [];

// Get all newspapers
app.get('/api/newspapers', (_req, res) => {
  res.json(newspapers);
});

// Get single newspaper
app.get('/api/newspapers/:id', (req, res) => {
  const paper = newspapers.find((n) => n.id === req.params.id);
  if (!paper) return res.status(404).json({ error: 'Not found' });
  res.json(paper);
});

// Create newspaper
app.post('/api/newspapers', (req, res) => {
  const { brand, mainHeading, mainContent, subHeadings, subSubHeadings } = req.body as Omit<Newspaper, 'id' | 'createdAt'>;
  if (typeof brand !== 'string' || !brand.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: brand' });
  }
  if (typeof mainHeading !== 'string' || !mainHeading.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: mainHeading' });
  }
  if (typeof mainContent !== 'string' || !mainContent.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: mainContent' });
  }
  if (!Array.isArray(subHeadings) || subHeadings.length !== 2) {
    return res.status(400).json({ error: 'subHeadings must be an array of exactly 2 items' });
  }
  if (!Array.isArray(subSubHeadings) || subSubHeadings.length !== 3) {
    return res.status(400).json({ error: 'subSubHeadings must be an array of exactly 3 items' });
  }
  const newspaper: Newspaper = {
    id: uuidv4(),
    brand,
    mainHeading,
    mainContent,
    subHeadings,
    subSubHeadings,
    createdAt: new Date().toISOString(),
  };
  newspapers.push(newspaper);
  res.status(201).json(newspaper);
});

// Update newspaper
app.put('/api/newspapers/:id', (req, res) => {
  const idx = newspapers.findIndex((n) => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { brand, mainHeading, mainContent, subHeadings, subSubHeadings } = req.body as Partial<Omit<Newspaper, 'id' | 'createdAt'>>;
  if (brand !== undefined && (typeof brand !== 'string' || !brand.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: brand' });
  }
  if (mainHeading !== undefined && (typeof mainHeading !== 'string' || !mainHeading.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: mainHeading' });
  }
  if (mainContent !== undefined && (typeof mainContent !== 'string' || !mainContent.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: mainContent' });
  }
  if (subHeadings !== undefined && (!Array.isArray(subHeadings) || subHeadings.length !== 2)) {
    return res.status(400).json({ error: 'subHeadings must be an array of exactly 2 items' });
  }
  if (subSubHeadings !== undefined && (!Array.isArray(subSubHeadings) || subSubHeadings.length !== 3)) {
    return res.status(400).json({ error: 'subSubHeadings must be an array of exactly 3 items' });
  }
  newspapers[idx] = {
    ...newspapers[idx],
    ...(brand !== undefined && { brand }),
    ...(mainHeading !== undefined && { mainHeading }),
    ...(mainContent !== undefined && { mainContent }),
    ...(subHeadings !== undefined && { subHeadings }),
    ...(subSubHeadings !== undefined && { subSubHeadings }),
  };
  res.json(newspapers[idx]);
});

// Delete newspaper
app.delete('/api/newspapers/:id', (req, res) => {
  newspapers = newspapers.filter((n) => n.id !== req.params.id);
  res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
