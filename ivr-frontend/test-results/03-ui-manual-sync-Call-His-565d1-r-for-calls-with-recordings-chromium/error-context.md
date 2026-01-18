# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog "Failed to compile" [ref=e4]:
    - generic [ref=e5]:
      - heading "Failed to compile" [level=4] [ref=e7]
      - generic [ref=e8]:
        - generic [ref=e10]: "./src/pages/RecordingsPage.tsx:2:0 Module not found: Can't resolve 'react-router-dom' 1 | import React, { useState, useEffect } from 'react'; > 2 | import { useSearchParams } from 'react-router-dom'; 3 | import { Calendar, Phone, Clock, Filter, RefreshCw } from 'lucide-react'; 4 | import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; 5 | import { Button } from '@/components/ui/button'; https://nextjs.org/docs/messages/module-not-found Import trace for requested module: ./src/app/recordings/page.tsx"
        - contentinfo [ref=e11]:
          - paragraph [ref=e12]: This error occurred during the build process and can only be dismissed by fixing the error.
```