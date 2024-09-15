// Import necessary components
import React from 'react';
import { Grid, Box } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface = () => {
  return (
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
            1 из 2
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
            2 из 2
          </Box>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

// Export the main component
export default Interface;