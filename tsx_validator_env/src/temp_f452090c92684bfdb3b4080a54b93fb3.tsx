// Import necessary components
import React from 'react';
import { Grid, Card, Input, Button, Typography, Box } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface: React.FC = () => {
  return (
    <div>
      <Grid borderRadius="var(--4-border)" st={{ width: '100%', padding: 0 }}>
        <Grid.Row borderRadius="var(--4-border)" background="var(--error-red-100)">
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box st={{ flex: '1' }} px="var(--8-space)" py="var(--16-space)" borderRadius="var(--4-border)" background="var(--primary-blue-400)">
              <Typography variant="Body1">Content 1</Typography>
            </Box>
          </Grid.Column>
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box st={{ flex: '1' }} px="var(--8-space)" py="var(--16-space)" borderRadius="var(--4-border)" background="var(--primary-blue-400)">
              <Typography variant="Body1">Content 2</Typography>
            </Box>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Card orientation="vertical" indicatorSize="s" indicatorStatus="default">
        <Typography variant="Body1">This is a simple card.</Typography>
      </Card>
      <Input label="Enter text" helperText="Helper text" />
      <Button>Submit</Button>
    </div>
  );
};

// Export the main component
export default Interface;