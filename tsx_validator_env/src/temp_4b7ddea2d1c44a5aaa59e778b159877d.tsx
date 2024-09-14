```tsx
// Import necessary components
import React from 'react';
import { Grid, Box, Typography, Card, Button, Input, Snackbar } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface = () => {
  return (
    <div>
      {/* Grid Component */}
      <Grid borderRadius="var(--4-border)">
        <Grid.Row borderRadius="var(--4-border)" background="var(--error-red-100)">
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box
              st={{ flex: '1' }}
              px="var(--8-space)"
              py="var(--16-space)"
              borderRadius="var(--4-border)"
              background="var(--primary-blue-400)"
            >
              <Typography variant="Heading3">Content 1</Typography>
            </Box>
          </Grid.Column>
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box
              st={{ flex: '1' }}
              px="var(--8-space)"
              py="var(--16-space)"
              borderRadius="var(--4-border)"
              background="var(--primary-blue-400)"
            >
              <Typography variant="Heading3">Content 2</Typography>
            </Box>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Card Component */}
      <Card className="card-class">
        <Typography variant="Heading3">Card Title</Typography>
        <Button>Click Me</Button>
      </Card>

      {/* Input Component */}
      <Input label="Enter text" />

      {/* Snackbar Component */}
      <Snackbar>This is a notification message.</Snackbar>
    </div>
  );
};

// Export the main component
export default Interface;
```