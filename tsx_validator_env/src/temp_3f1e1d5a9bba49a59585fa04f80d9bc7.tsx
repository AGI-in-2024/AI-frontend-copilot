```tsx
// Import necessary components
import React from 'react';
import { Grid, Card, Typography, Divider, Button } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface = () => {
  return (
    <Grid container spacing={2}>
      <Card>
        <Typography variant="Heading3">Simple UI</Typography>
        <Divider />
        <Button variant="primary">Click Me</Button>
      </Card>
    </Grid>
  );
};

// Export the main component
export default Interface;
```