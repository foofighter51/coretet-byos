# TrackDetailsPanel Test Checklist

## Test Scenarios

### 1. Basic Edit Functionality
- [ ] Click edit button on any section
- [ ] Verify save button (✓) saves changes
- [ ] Verify cancel button (✗) discards changes

### 2. Unsaved Changes Warning
- [ ] Start editing a field
- [ ] Make a change to trigger unsaved state
- [ ] Navigate to another track
- [ ] Verify warning dialog appears
- [ ] Test "Discard Changes" button
- [ ] Test "Continue Editing" button
- [ ] Test "Save Changes" button

### 3. Dialog State Management
- [ ] Open edit mode on track A
- [ ] Navigate to track B without changes
- [ ] Verify dialog resets properly
- [ ] Verify no warning appears

### 4. Multi-field Editing
- [ ] Edit multiple fields in one section
- [ ] Verify all changes are tracked
- [ ] Save and verify all changes persist

### 5. Time Signature Multi-select
- [ ] Edit Musical Properties
- [ ] Select multiple time signatures
- [ ] Add custom time signature
- [ ] Save and verify display

## Expected Behaviors
1. ✓ (Check) button should SAVE changes
2. ✗ (X) button should CANCEL changes
3. Warning should only appear when there are actual unsaved changes
4. Dialog should close/reset when navigating between tracks without unsaved changes