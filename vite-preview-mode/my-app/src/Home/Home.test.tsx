import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './index';

describe('Home.test.tsx', () => {
  it('should show the main header', async () => {
    render(<Home />);
    const heading = await screen.findByRole('heading');
    expect(heading).toHaveTextContent('Vite + React');
  });

  it('should start with count 0', async () => {
    render(<Home />);
    const countButton = await screen.findByRole('button');
    expect(countButton).toHaveTextContent('0');
  });

  it('should increment count on click', async () => {
    render(<Home />);
    const countButton = await screen.findByRole('button');
    await userEvent.click(countButton);
    await userEvent.click(countButton);
    expect(countButton).toHaveTextContent('2');
  });
});
