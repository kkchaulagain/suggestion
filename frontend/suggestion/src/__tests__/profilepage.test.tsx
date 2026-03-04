import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '../pages/business-dashboard/pages/ProfilePage';

describe('ProfilePage Component', () => {
  it('renders the initial profile placeholder data', () => {
    render(<ProfilePage />);
    
   
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Need to Call API')).toBeInTheDocument();
    expect(screen.getByText('(API pending)')).toBeInTheDocument();
  });

  it('opens the edit dialog when "Edit Profile" is clicked', () => {
    render(<ProfilePage />);
    
    // Checking that dialog is not visible initially
    expect(screen.queryByText('Edit Profile', { selector: 'h2' })).not.toBeInTheDocument();

    // Clicking the Edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Verifying dialog appears
    expect(screen.getByText('Edit Profile', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter the name')).toBeInTheDocument();
  });

  it('closes the dialog when clicking "Cancel"', () => {
    render(<ProfilePage />);
    
    // Opening dialog
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    
    // Clicking cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Verify dialog is gone
    expect(screen.queryByText('Edit Profile', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('closes the dialog when clicking "Save Changes"', () => {
    render(<ProfilePage />);
    
    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    
    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Verify dialog is gone
    expect(screen.queryByText('Edit Profile', { selector: 'h2' })).not.toBeInTheDocument();
  });
});