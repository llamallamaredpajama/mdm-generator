# Orders Card UI Cleanup — Design Document

**Date:** 2026-03-01
**Status:** Approved

## Overview

Redesign the Orders Card in Build Mode to improve visual clarity, organizational logic, and consistency with other dashboard cards. This includes header alignment, visual separation between panels, dropdown state visibility, checkbox styling, and reorganizing imaging tests by modality with a comprehensive MRI catalog expansion.

## Current Problems

1. **Header inconsistency**: Orders card titles don't match the font size/weight of other Build Mode cards (CdrCard, DifferentialPreview)
2. **No visual separation**: Left (Orders) and Right (Order Sets) panels lack a clear divider
3. **Dropdown titles disappear**: When a section is expanded/selected, white title text on white background becomes invisible
4. **Checkbox colors wrong**: Selected checkboxes are blue (should be green); unselected checkboxes appear black/filled (should be empty)
5. **"Create Orderset" button misplaced**: Currently at bottom of left panel; should be in title bar
6. **Imaging grouped by body region**: Should be grouped by imaging modality (X-ray, CT, US, MRI, Fluoroscopy, Nuclear Medicine)
7. **Long lists in single column**: Lists with 8+ items should use multi-column layout
8. **Missing imaging studies**: Nuclear Medicine, Fluoroscopy, and MRI sections need significant expansion

## Design Changes

### 1. Layout & Header Hierarchy

**Split title bars** — each panel gets its own title bar at the same height:

```
┌──────────────────────────────┬──────────────────────────────┐
│  Orders  [Save as Orderset]  │  Order Sets          [Manage]│
├──────────────────────────────┼──────────────────────────────┤
│  ▸ Recommended Orders        │  ▸ Frequently Used Ordersets │
│  ▸ Frequently Used           │  ▸ All Order Sets            │
│  ▸ Labs                      │                              │
│  ▸ Imaging                   │                              │
│  ▸ Procedures                │                              │
└──────────────────────────────┴──────────────────────────────┘
```

- **Left title bar**: "Orders" (h4, `font-size: 1rem; font-weight: 600`) + "Save as Orderset" button (right-justified, same style as "Manage" button)
- **Right title bar**: "Order Sets" (h4, `font-size: 1rem; font-weight: 600`) + "Manage" button (right-justified)
- Title bars share: `padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.75rem`
- **Vertical divider**: `border-right: 1px solid var(--color-border)` on left panel
- Button previously labeled "Create Orderset" is renamed to **"Save as Orderset"** and moved from bottom of left panel to the left title bar
- Subtitle headers ("Recommended Orders", "Frequently Used Ordersets") align horizontally across panels

### 2. Dropdown Section Headers — Selected State

When a section is expanded, apply a dark blue background:

```css
.orders-card__section-header--open {
  background-color: #1e40af;  /* darker blue for contrast */
  color: #ffffff;
  border-radius: 4px;
  padding: 0.375rem 0.5rem;
}
```

- **Closed state**: No background, dark text (current behavior for collapsed)
- **Open/expanded state**: Dark blue background (#1e40af), white text, subtle border-radius
- Chevron icon also turns white when open
- Applies to all collapsible sections: main sections AND subcategory groups within categories

### 3. Checkbox Styling

```css
/* Custom checkbox: empty when unchecked, green when checked */
.orders-card__checkbox {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 1.5px solid #cbd5e1;  /* light gray border, empty inside */
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.orders-card__checkbox:checked {
  background-color: #22c55e;  /* green */
  border-color: #22c55e;
}

/* White checkmark via ::after pseudo-element */
.orders-card__checkbox:checked::after {
  content: '';
  position: absolute;
  /* checkmark shape with borders */
}
```

- **Unselected**: Empty box with light gray border (`#cbd5e1`), transparent background
- **Selected**: Green background (`#22c55e`) with white checkmark
- Replaces native checkbox with custom styled version using `appearance: none`

### 4. Imaging Reorganization by Modality

Replace body-region subcategories with modality-based grouping:

#### X-ray (8 items)
- Chest X-ray (CXR)
- Panoramic Dental X-ray (Panorex)
- X-ray Abdomen (KUB)
- X-ray Extremity
- X-ray Pelvis
- X-ray Ribs
- X-ray Soft Tissue Neck
- X-ray Spine

#### CT (14 items)
- CT Abdomen/Pelvis
- CT C-spine
- CT Chest
- CT Extremity
- CT Head
- CT Neck Soft Tissue
- CT Orbits
- CT Sinuses
- CT Thoracolumbar Spine
- CTA Abdomen/Pelvis
- CTA Chest
- CTA Chest/Abdomen/Pelvis
- CTA Extremity
- CTA Head/Neck

#### Ultrasound (15 items)
- Carotid Duplex
- Echo TTE
- LE Venous Duplex (DVT)
- Ocular Ultrasound
- Pelvic Ultrasound
- UE Venous Duplex
- US Aorta
- US FAST
- US IVC (Volume Assessment)
- US Lung (POCUS)
- US OB (Obstetric)
- US Renal
- US RUQ (Gallbladder)
- US Soft Tissue
- US Testicular/Scrotal

#### MRI (~40 items, nested sub-sections)

**Brain/Head:**
- MRA Head (Circle of Willis)
- MRI Brain with and without contrast
- MRI Brain with contrast
- MRI Brain without contrast
- MRI IAC (Internal Auditory Canal)
- MRI Orbits with contrast
- MRI Pituitary with contrast

**Neck/Vascular:**
- MR Venogram (MRV) Brain
- MRA Neck (Carotid/Vertebral)
- MRI Soft Tissue Neck with contrast

**Spine:**
- MRI Cervical Spine with contrast
- MRI Cervical Spine without contrast
- MRI Lumbar Spine with contrast
- MRI Lumbar Spine without contrast
- MRI Thoracic Spine with contrast
- MRI Thoracic Spine without contrast
- MRI Total Spine with contrast

**Chest:**
- MRA Chest/Pulmonary
- MRI Chest with contrast

**Cardiac:**
- MRA Aorta
- MRI Cardiac with contrast

**Abdomen/Pelvis:**
- MRA Abdomen (Mesenteric)
- MRCP (MR Cholangiopancreatography)
- MRI Abdomen without contrast
- MRI Abdomen/Pelvis with contrast
- MRI Pelvis with contrast
- MRI Pelvis without contrast

**Extremity/MSK:**
- MRA Upper/Lower Extremity
- MRI Ankle/Foot
- MRI any extremity with contrast
- MRI Hip without contrast
- MRI Knee
- MRI Shoulder
- MRI Wrist

**Pediatric:**
- MRI Abdomen/Pelvis without contrast (Peds)
- MRI Brain (NAT evaluation)
- MRI Spine (SCIWORA)
- Rapid/Quick Brain MRI

**Special Protocols:**
- MRI with ferumoxytol
- MRI without sedation fast protocols
- Stroke Protocol MRI

#### Fluoroscopy (10 items)
- Air/Contrast Enema (Intussusception)
- Angiography/Embolization
- Contrast Enema
- Esophagram/Swallow Study
- IVC Filter Placement
- Retrograde Cystogram
- Retrograde Urethrogram (RUG)
- Upper GI (Malrotation/Volvulus)
- Upper GI Series/Esophagram
- Upper GI with SBFT

#### Nuclear Medicine (6 items)
- Bone Scan (Tc-99m MDP)
- GI Bleeding Scan (Tagged RBC)
- HIDA Scan (Cholescintigraphy)
- Meckel's Scan (Tc-99m Pertechnetate)
- Myocardial Perfusion Imaging (MPI)
- V/Q Scan

### 5. Multi-Column Layout for Long Lists

When a subcategory/section has >8 items, use CSS grid for multi-column:

```css
.orders-card__test-list--multi-col {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.25rem 1rem;
}
```

- Auto-flows into 2-3 columns based on available width
- ~5 items per column
- Reverts to single column on mobile (<768px)
- Applies to: CT (14), Ultrasound (15), X-ray (8), Fluoroscopy (10), MRI sub-sections (7 items in Brain/Head, 7 in Spine, etc.)

### 6. Seed Data Changes

**New entries to add** (category: `imaging`):

Nuclear Medicine subcategory (`nuclear_medicine`):
- `myocardial_perfusion_imaging` — Myocardial Perfusion Imaging (MPI)
- `hida_scan` — HIDA Scan (Cholescintigraphy)
- `bone_scan` — Bone Scan (Tc-99m MDP)
- `gi_bleeding_scan` — GI Bleeding Scan (Tagged RBC)
- `meckels_scan` — Meckel's Scan (Tc-99m Pertechnetate)

Fluoroscopy subcategory (`fluoroscopy`):
- `air_contrast_enema` — Air/Contrast Enema (Intussusception)
- `upper_gi_malrotation` — Upper GI (Malrotation/Volvulus)
- `upper_gi_series_esophagram` — Upper GI Series/Esophagram
- `contrast_enema` — Contrast Enema
- `retrograde_urethrogram` — Retrograde Urethrogram (RUG)
- `retrograde_cystogram` — Retrograde Cystogram
- `angiography_embolization` — Angiography/Embolization
- `ivc_filter_placement` — IVC Filter Placement

MRI subcategory (`mri`) — all new MRI entries from the expanded catalog (~37 new entries replacing the 3 existing generic ones: MRI Brain, MRI Spine, MRI Extremity)

**Reclassifications:**
- V/Q Scan: `chest` → `nuclear_medicine`
- Esophagram/Swallow Study: `abdomen` → `fluoroscopy`
- Upper GI with SBFT: `abdomen` → `fluoroscopy`
- Fluoroscopy (generic): `misc` → **remove** (replaced by specific fluoroscopy entries)

**Subcategory utils updates:**
- Add new subcategory labels: `xray`, `ct`, `ultrasound`, `mri`, `fluoroscopy`, `nuclear_medicine`
- Add MRI sub-section labels: `mri_brain_head`, `mri_neck_vascular`, `mri_spine`, `mri_chest`, `mri_cardiac`, `mri_abdomen_pelvis`, `mri_extremity_msk`, `mri_pediatric`, `mri_special_protocols`
- Update `CATEGORY_ORDER` for imaging modality display order: X-ray → CT → Ultrasound → MRI → Fluoroscopy → Nuclear Medicine
- Remove old body-region subcategories from imaging: `head_neck`, `chest`, `abdomen`, `spine`, `soft_tissue`, `extremity`, `vascular`, `cardiac`, `genitourinary`, `obstetric`, `misc`

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/seed-test-library.ts` | Add ~50 new imaging tests, reclassify existing, update subcategories |
| `frontend/src/components/build-mode/shared/subcategoryUtils.ts` | New modality-based subcategories, MRI sub-sections, updated labels/order |
| `frontend/src/components/build-mode/shared/OrdersCard.tsx` | Split title bars, move "Save as Orderset" button, vertical divider |
| `frontend/src/components/build-mode/shared/OrdersCard.css` | Title bar styles, dropdown open state, checkbox custom styles, multi-column grid |
| `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx` | Update section header rendering, remove bottom "Create Orderset" button |
| `frontend/src/components/build-mode/shared/OrdersRightPanel.tsx` | Align title with left panel |
| `frontend/src/components/build-mode/shared/SubcategoryGroup.tsx` | Open state styling, multi-column for long lists |
| `frontend/src/components/build-mode/shared/SubcategoryGroup.css` | Open header styles |

## Design Decisions

1. **CTAs grouped with CTs** — since CTA is CT technology, keeps modality grouping pure
2. **Duplex studies under Ultrasound** — consistent modality-based approach
3. **Dark blue (#1e40af) for open sections** — provides good contrast with white text without being as jarring as primary blue
4. **MRI has nested sub-sections** — necessary due to ~40 items; sub-sections (Brain/Head, Spine, etc.) provide additional organization layer
5. **"Save as Orderset"** replaces "Create Orderset" — clearer intent (saving current selection as a set)
6. **Multi-column at >8 items** — prevents long single-column lists, ~5 items per column
