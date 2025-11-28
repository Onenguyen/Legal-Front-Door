# LOPS General Intake Form - Testing Guide

## Access the Form

The form is available at: **http://localhost:8000/lops-general-intake.html**

---

## Test Scenarios

### 1. Progress Indicator Test ✓
**Steps:**
1. Open the form
2. Observe the progress bar at the top (should show 0% initially)
3. Select "Signature" for help type
4. Watch the progress bar update
5. Fill in more required fields
6. Verify the progress percentage increases

**Expected Result:**
- Progress bar fills from left to right
- Percentage text updates (e.g., "33% Complete")
- Required fields count updates (e.g., "2 of 6 required fields completed")

---

### 2. Summary Panel Test ✓
**Steps:**
1. Scroll down the page
2. Notice the summary panel on the right stays visible (sticky)
3. Select a help type
4. Enter a completion date
5. Watch the summary panel update in real-time

**Expected Result:**
- Summary panel remains visible while scrolling
- "Request Type" updates when help type is selected
- "Completion Date" displays in readable format
- Progress bar in summary matches main progress bar
- Required fields checklist shows with checkmarks for completed fields

---

### 3. Horizontal Radio Buttons Test ✓
**Steps:**
1. Look at "What kind of help do you need?"
2. Notice the three options are displayed horizontally
3. Click on each option
4. Observe the card-style selection

**Expected Result:**
- Options displayed as cards in a row
- Selected option has green background (#00FFA3)
- Hover effect shows shadow
- Works for all Yes/No questions throughout the form

---

### 4. Auto-Save Test ✓
**Steps:**
1. Fill in some fields (e.g., select help type, enter a date)
2. Wait 3 seconds
3. Look at bottom of summary panel for "Auto-saved" indicator
4. Close the browser tab
5. Reopen http://localhost:8000/lops-general-intake.html
6. Verify your data is restored

**Expected Result:**
- "Auto-saved" appears after 3 seconds of inactivity
- Form data persists across browser sessions
- "Clear Draft" button removes saved data

---

### 5. Tooltips Test ✓
**Steps:**
1. Find the completion date field
2. Hover over the ⓘ icon next to the label
3. Read the tooltip

**Expected Result:**
- Tooltip appears on hover
- Shows "Standard turnaround is 3-5 business days"
- Black background with green text
- Arrow pointing to icon

---

### 6. Conditional Sections Test ✓
**Steps:**
1. Select "Signature" as help type
2. Watch the Signature Details section slide down
3. Select "Wet Ink" signature type
4. Watch additional Wet Ink options appear
5. Check "Notarize" checkbox
6. Watch notarization section appear

**Expected Result:**
- Sections animate smoothly (slide down)
- Page scrolls to new sections automatically
- Hidden sections don't clutter the form
- Smooth transitions (0.3s)

---

### 7. Inline Validation Test ✓
**Steps:**
1. Select "Signature" as help type
2. Click on "Upload file to sign" and then click away (don't upload)
3. Observe the red error border
4. Upload a file
5. See green checkmark appear on the label

**Expected Result:**
- Invalid fields show red border with shake animation
- Valid required fields show green checkmark
- Validation only triggers after field is touched
- No annoying validation before user interacts

---

### 8. Review Modal Test ✓
**Steps:**
1. Fill out the entire form for "Signature" request:
   - Upload a file
   - Select E-Signature
   - Fill all required fields
2. Click "Submit Request"
3. Review modal should appear with summary
4. Click "Edit" to go back, or
5. Click "Confirm & Submit" to complete

**Expected Result:**
- Modal appears centered on screen
- Shows all entered data organized by section
- Can close modal and continue editing
- Confirm button completes the submission
- Loading spinner shows briefly
- Success message appears

---

### 9. Mobile Responsive Test ✓
**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select iPhone or small viewport
4. Observe layout changes

**Expected Result on Mobile:**
- Summary panel appears above the form (not beside)
- Horizontal radio buttons stack vertically
- Progress indicator text stacks
- Form is fully usable with touch
- No horizontal scrolling

---

### 10. Complete Workflow Tests

#### Test A: E-Signature Request
1. Select "Signature"
2. Upload a test file
3. Select "E-Signature"
4. Click Submit
5. Verify review modal shows correct data
6. Confirm and submit
7. Verify success message with request ID

#### Test B: Wet Ink with Notarization
1. Select "Signature"
2. Upload a test file
3. Select "Wet Ink"
4. Check "Notarize"
5. Fill all notarization fields (apostille, location, state, copies)
6. Select scanned copy preference
7. Select wet ink handling
8. Submit and review
9. Confirm submission works

#### Test C: Contract Pull
1. Select "Contract Pull"
2. Select "Yes" for sales contract
3. Select originating entity
4. Enter agreement name
5. Enter description
6. Submit and review
7. Verify all data appears correctly

#### Test D: Other Request
1. Select "Other"
2. Enter detailed description
3. Submit immediately
4. Should work with minimal fields

---

## Browser Compatibility Checklist

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Known Behaviors

### Auto-Save
- Drafts expire after 7 days
- Clearing browser data clears drafts
- Each browser/device maintains separate drafts

### Progress Tracking
- Only counts fields relevant to selected help type
- Dynamically recalculates when help type changes

### Animations
- Uses GPU-accelerated transforms for smooth 60fps
- Respects prefers-reduced-motion for accessibility

---

## Performance Expectations

- **Initial Load:** < 1 second
- **Form Interaction:** Instant (< 16ms)
- **Auto-Save:** 3-second debounce
- **Submission:** ~800ms (artificial delay for UX)
- **Animations:** 60fps smooth

---

## Accessibility

All features are keyboard accessible:
- Tab through all form fields
- Space/Enter to toggle checkboxes/radios
- Escape to close review modal
- Screen reader friendly

---

## Success Criteria

✅ All 10 improvements working as described
✅ No console errors
✅ Smooth animations throughout
✅ Data persists via auto-save
✅ Mobile experience is excellent
✅ Review modal shows all data correctly
✅ Form submission creates request with correct ID
✅ Existing Cohesity styling maintained
✅ Progress tracking is accurate
✅ Summary panel updates in real-time

---

## Troubleshooting

**If progress bar doesn't update:**
- Check browser console for JavaScript errors
- Verify all required scripts are loading

**If auto-save doesn't work:**
- Check if localStorage is enabled in browser
- Check browser privacy settings
- Try clearing localStorage and refresh

**If animations are janky:**
- Check CPU usage
- Try disabling browser extensions
- Use Chrome DevTools Performance tab

**If modal doesn't appear:**
- Check for JavaScript errors
- Verify form validation is passing
- Check z-index issues with dev tools

---

## Next Steps After Testing

1. Gather user feedback
2. Monitor form completion rates
3. Track abandonment points
4. A/B test different layouts
5. Add analytics events
6. Iterate on UX based on data

---

## Contact

For issues or questions, check the main `FORM_IMPROVEMENTS_SUMMARY.md` document.

