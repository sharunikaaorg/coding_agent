# Context-Optimized Coding Agent Frontend

A modern React dashboard showcasing the efficiency gains from intelligent context processing using a multi-model approach.

## Features

### 🎯 Interactive Dashboard
- **Task Input**: Easy-to-use form with example tasks
- **Real-time Comparison**: Side-by-side pipeline results
- **Performance Metrics**: Token reduction, cost savings, quality scores
- **Visual Charts**: Interactive comparisons using Recharts

### 📊 Metrics Visualization
- **Token Usage**: Before/after comparison with reduction percentages
- **Cost Analysis**: API cost savings breakdown
- **Quality Assessment**: LLM-as-judge scoring with radar charts
- **Context Compression**: Input filtering effectiveness

### 🔄 Pipeline Modes
- **Baseline Only**: Test traditional full-context approach
- **Optimized Only**: Test filtered context approach
- **Full Comparison**: Run both pipelines and compare results

## Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast development and building
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive data visualization
- **Lucide React** - Beautiful icons

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Backend running on `http://localhost:8000`

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── MetricCard.tsx   # Metric display card
│   │   ├── ProgressBar.tsx  # Progress visualization
│   │   ├── ComparisonChart.tsx  # Charts and graphs
│   │   ├── TaskForm.tsx     # Input form
│   │   ├── ResultsDisplay.tsx   # Results panel
│   │   └── StatusIndicator.tsx  # Backend health status
│   ├── hooks/               # Custom React hooks
│   │   └── useApi.ts        # API interaction hooks
│   ├── services/            # API services
│   │   └── api.ts           # Backend API client
│   ├── types/               # TypeScript definitions
│   │   └── api.ts           # API response types
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles with Tailwind
├── public/
│   └── brain.svg            # Favicon
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Key Components

### TaskForm Component
- Example task selector with pre-built scenarios
- Code/context textarea with character count
- Multiple execution modes (baseline, optimized, comparison)

### ResultsDisplay Component
- Metrics overview cards
- Detailed pipeline results
- Output comparison with copy functionality
- Expandable/collapsible content

### ComparisonChart Component
- Bar charts for performance metrics
- Radar charts for quality assessment
- Interactive tooltips and legends

### StatusIndicator Component
- Real-time backend health monitoring
- Service-specific status (Groq, Ollama)
- Automatic refresh capability

## API Integration

The frontend connects to the FastAPI backend using:

- **Health Check**: `GET /health` - Service status monitoring
- **Baseline Pipeline**: `POST /baseline` - Single model execution
- **Optimized Pipeline**: `POST /optimized` - Multi-model execution  
- **Evaluation**: `POST /evaluate` - Full comparison analysis

## Styling

### Tailwind CSS Classes
- **Cards**: `.card` - Consistent card styling
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary` - Button variants
- **Metrics**: `.metric-card` - Specialized metric display
- **Progress**: `.progress-bar`, `.progress-fill` - Progress indicators

### Color Scheme
- **Primary**: Blue tones for main actions and branding
- **Success**: Green for positive metrics and improvements
- **Warning**: Yellow for neutral or cautionary states
- **Danger**: Red for errors or negative impacts

## Performance Optimizations

- **Code Splitting**: Vite handles automatic code splitting
- **Lazy Loading**: Results load only after API responses
- **Memoization**: React hooks prevent unnecessary re-renders
- **Responsive Design**: Mobile-first approach with breakpoints

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint code quality checks
- `npm run preview` - Preview production build locally

### Environment Variables

Create `.env` file for configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Proxy Configuration

Vite proxy is configured to route `/api/*` requests to the backend, allowing for seamless development.

## Deployment

### Static Hosting
The built application is a static SPA that can be deployed to:
- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront
- Any static file server

### Docker Deployment

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **API Connection Failed**: Ensure backend is running on `http://localhost:8000`
2. **CORS Errors**: Backend CORS is configured for `http://localhost:3000`
3. **Build Failures**: Check Node.js version (18+ required)
4. **Styling Issues**: Ensure Tailwind CSS is properly configured

### Debug Mode

Enable detailed logging in browser developer tools:

```javascript
localStorage.setItem('debug', 'api:*');
```

## Contributing

1. Follow the existing component patterns
2. Add TypeScript types for new features
3. Use Tailwind classes consistently
4. Test on multiple screen sizes
5. Update this README for new features

---

**Ready to showcase your context optimization results!** 🚀