import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    // This assumes your button variant classes include 'bg-destructive' from shadcn
    expect(buttonElement.className).toMatch(/bg-destructive/);
  });
});
