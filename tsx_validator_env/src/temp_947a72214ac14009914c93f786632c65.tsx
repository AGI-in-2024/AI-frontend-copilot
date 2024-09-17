// Import necessary components
import React from 'react';
import { Header, Grid, Box, Typography, Divider, Card, ImagePicture, Button } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface = () => {
  return (
    <div>
      <Header 
        title="Welcome to Our Landing Page" 
        description="This is a brief description of what we offer." 
        bg={true} 
      />
      <Grid borderRadius="var(--4-border)">
        <Grid.Row borderRadius="var(--4-border)" background="var(--error-red-100)">
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box 
              px="var(--8-space)" 
              py="var(--16-space)" 
              borderRadius="var(--4-border)" 
              background="var(--primary-blue-400)"
            >
              <Typography variant="Body1-Medium">Content 1</Typography>
            </Box>
          </Grid.Column>
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box 
              px="var(--8-space)" 
              py="var(--16-space)" 
              borderRadius="var(--4-border)" 
              background="var(--primary-blue-400)"
            >
              <Typography variant="Body1-Medium">Content 2</Typography>
            </Box>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Divider orientation="horizontal" />
      <Card orientation="vertical">
        <ImagePicture 
          src="https://example.com/image.jpg" 
          aspectRatio="ratio-16x9" 
          radius="radius-8px" 
        />
        <Typography variant="Heading2">Card Title</Typography>
        <Typography variant="Body1">This is a description of the card.</Typography>
        <Button variant="primary">Learn More</Button>
      </Card>
    </div>
  );
};

// Export the main component
export default Interface;