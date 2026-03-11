from PIL import Image
import os

def crop_sprites():
    source_path = 'apps/web/public/agents-sprite.png'
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found.")
        return

    img = Image.open(source_path)
    width, height = img.size
    print(f"Image size: {width}x{height}")

    # Assuming 3 columns and 2 rows
    cols = 3
    rows = 2
    
    cell_width = width // cols
    cell_height = height // rows
    
    print(f"Cell size: {cell_width}x{cell_height}")

    # Define output filenames based on role mapping
    # Row 0: Product Owner, Architect, Tech Lead
    # Row 1: Ticket Gen, VR (Test Gen), Operator (Ticket Orch)
    # Wait. Let's re-verify mapping.
    # Row 0: Purple (PO), Blue (Arch), Orange (Tech Lead)
    # Row 1: Orange Glasses (Ticket Gen), VR (Test Gen - previously I mapped VR to Test Gen), Blue Operator (Ticket Orch - previously I mapped Operator to Ticket Orch)
    
    # Correction based on previous thought:
    # Row 1 Middle is VR. Row 1 Right is Operator.
    # Previous mapping: 
    # 'Ticket Orchestrator': { x: 100, y: 100 } -> Operator (Right)
    # 'Test Generator': { x: 50, y: 100 } -> VR (Middle)
    
    filenames = [
        ['agent-product-owner.png', 'agent-architect.png', 'agent-tech-lead.png'],
        ['agent-ticket-gen.png', 'agent-test-gen.png', 'agent-ticket-orch.png'] # Swap last two if needed?
        # Row 1 Middle is VR -> agent-test-gen.png
        # Row 1 Right is Operator -> agent-ticket-orch.png
    ]

    # Manual offsets based on the provided image structure
    # Header takes up significant space at the top.
    # Image size: 2048x2066
    
    # Estimated offsets:
    # Header is roughly 300-350px high.
    # First row of faces starts around Y=350.
    # Second row of faces starts around Y=1250 (after the first row text labels).
    
    # Update: User says some are still off-center.
    # Switching to a more robust approach:
    # 1. Slightly smaller crop width (640px) to allow horizontal centering adjustments.
    # 2. Individual row adjustments.
    # 3. Reverting Row 1 to ~220 (compromise between 150 and 300).
    
    # Grid config
    # Row 1 Y: 220
    # Row 2 Y: 1000 (Test Gen is here and is good)
    row_y_starts = [220, 1000] 
    
    # Crop settings
    crop_size = 640 # Square crop, smaller than cell width to allow centering
    
    for r in range(rows):
        y_start = row_y_starts[r]
        for c in range(cols):
            # Horizontal centering calculation
            # Cell width is 682. Crop is 640.
            # Margin = (682 - 640) / 2 = 21
            left = (c * cell_width) + 21
            
            top = y_start
            right = left + crop_size
            bottom = top + crop_size
            
            # Crop
            cell = img.crop((left, top, right, bottom))
            
            # Save
            filename = filenames[r][c]
            output_path = os.path.join('apps/web/public', filename)
            cell.save(output_path)
            print(f"Saved {output_path} (Coords: {left},{top},{right},{bottom})")

if __name__ == "__main__":
    crop_sprites()
