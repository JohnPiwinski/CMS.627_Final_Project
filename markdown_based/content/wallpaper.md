# Wallpaper Groups {#wallpaper-symmetries}

## Wallpaper symmetries {#wallpaper-exploration}
### What is a wallpaper group? {#wallpaper-introduction}
::scene[wallpaper-overview]

:::narration[wallpaper-overview-v2]
A wallpaper pattern repeats in two independent directions. Its symmetry group contains every translation, rotation, reflection, or glide reflection that preserves the pattern. There are seventeen types of wallpaper symmetry groups. Different designs can have the same type of symmetry. Here, the colors distinguish neighboring cells. We study symmetries of the outlines.
:::
::pause

### Explore the seventeen groups {#wallpaper-explorer}
::scene[wallpaper-playground]

:::narration[wallpaper-explorer-v2]
Choose any of the seventeen groups. Switch between the Artin drawings and the Wikipedia patterns. Use the lattice to translate, the dial to rotate, or a mirror line to reflect. When glide reflections are available, the fourth tool lets you reflect and then slide along an axis. Notice which transformations each pattern allows.
:::
::pause

## Fundamental domains {#wallpaper-domains}
### What is a fundamental domain? {#wallpaper-fundamental-domain}
::scene[wallpaper-domain]

:::narration[wallpaper-domain-v2]
How much of a wallpaper do we need to generate the whole wall? Start with one fleur-de-lis tile. It has a mirror, so its two halves carry the same information. Choose just one half. Images of this region under the full symmetry group cover the plane without overlapping interiors. Shared boundaries are allowed. Such a region is called a fundamental domain.
:::
::pause

### Can we change its shape? {#wallpaper-dissection}
::scene[wallpaper-dissection]

:::narration[wallpaper-dissection-v2]
Why should two fundamental domains for the same symmetry group be cut-and-reassembled versions of each other? Think about this before revealing the answer. Then overlay the red and blue boundaries. The blue pattern cuts a curved bite from the red domain. Select that bite and find a group symmetry that moves it into the blue gap. The rest stays in place.
:::
::pause

### Why does it work? {#wallpaper-explanation}
::scene[wallpaper-explanation]

:::narration[wallpaper-explanation-v2]
Overlay the two repeated domain patterns. Their intersections cut the red domain into pieces. Each piece belongs to a copy of the blue domain, so a group symmetry carries it back into our chosen blue domain. Coverage leaves no gaps, and non-overlap prevents duplicate interiors. For bounded domains, only finitely many copies meet. Our example needs one moving bite; other pairs may need more pieces. The group must be the same group acting on the same plane, not just the same wallpaper-group label. We ignore shared boundaries when cutting.
:::
::pause
