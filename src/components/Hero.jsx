// Hero.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Dynamic hero that swaps between “Today’s Picks” and category-specific highlights, fetches live data, and renders a promo grid with unbreakable images per the assignment.
// ------------------------------------------------------------

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllProducts, getProductsByCategory, normalizeCategory } from '../api/fakestore.js'
import { Link } from 'react-router-dom'

// Assignment: Image fallback so we NEVER flex a busted image icon.
// If an item image is missing (or throws an error), this steps in like a stunt double.
const FALLBACK = 'https://via.placeholder.com/800x600?text=Product'

// Tiny formatter so our headings stay pretty without a whole parade of conditionals.
const pretty = (cat)=> !cat || cat==='all' ? "Today's Picks" :
  ({ "men's clothing":"Men's Clothing","women's clothing":"Women's Clothing", jewelery:"Jewelery", electronics:"Electronics"}[cat] || cat)

export default function Hero({ activeCategory='all' }){
  // Assignment: Category normalization — accept anything, output the canonical category
  const normCat = normalizeCategory(activeCategory)
  const viewingCategory = !!(normCat && normCat !== 'all')

  // Assignment: Data fetching — hero pulls either all products or just the category
  const { data: products = [] } = useQuery({
    queryKey: ['hero-products', normCat],
    queryFn: () => viewingCategory ? getProductsByCategory(normCat) : getAllProducts(),
  })

  // Assignment: Pick logic — choose 4 cards and punchy labels for either mode
  const picks = useMemo(()=>{
    const men = products.filter(p => (p.category||'').toLowerCase().includes('men'))
    const women = products.filter(p => (p.category||'').toLowerCase().includes('women'))

    if (viewingCategory){
      const list = products.slice(0,4)
      return {
        headline: `Top Picks in ${pretty(normCat)}`,
        cards: list,
        labels: ['Popular','Trending',"Editor's Pick",'New In'],
        mode: 'category'
      }
    }

    // Home mode: grab a tasteful spread. Not perfect, just delightfully curated.
    const girl = women[0] || products[0]
    const man  = products.find(p => p.id === 1) || men[0] || products[1]
    return {
      headline: 'Add It. Love It. Keep It Simple.',
      cards: [girl, man, men[1]||men[0]||products[2], women[1]||women[0]||products[3]],
      labels: ["Girl's Top","Man's Bag",'Men Collection','Women Collection'],
      mode: 'home'
    }
  }, [products, normCat, viewingCategory])

  // Unpack our four headliners + their labels
  const [c1,c2,c3,c4] = picks.cards
  const [l1,l2,l3,l4] = picks.labels

  // Quick category links for the “collection” labels in home mode
  const enc = encodeURIComponent
  // Include #hero-start in the URL so clicking these drops users at the hero.
  const menCatUrl   = `/?cat=${enc("men's clothing")}#hero-start`
  const womenCatUrl = `/?cat=${enc("women's clothing")}#hero-start`
  const productLink = (p)=> p ? `/product/${p.id}` : "/"
  const categoryLinkByLabel = (label)=>{
    const low = (label||'').toLowerCase()
    if (low.includes('women')) return womenCatUrl
    if (low.includes('men'))   return menCatUrl
    return "/#hero-start"
  }

  // Link resolution: category mode → always product pages; home mode → mix of product and category links
  const link1 = picks.mode==='category' ? productLink(c1) : (l1.toLowerCase().includes('collection') ? categoryLinkByLabel(l1) : productLink(c1))
  const link2 = picks.mode==='category' ? productLink(c2) : (l2.toLowerCase().includes('collection') ? categoryLinkByLabel(l2) : productLink(c2))
  const link3 = picks.mode==='category' ? productLink(c3) : (l3.toLowerCase().includes('collection') ? categoryLinkByLabel(l3) : productLink(c3))
  const link4 = picks.mode==='category' ? productLink(c4) : (l4.toLowerCase().includes('collection') ? categoryLinkByLabel(l4) : productLink(c4))

  return (
    // 👇 Anchor for category switches:
    // We jump here (via #hero-start) when the category changes,
    // so the viewport lands at the top of the Hero—not mid-page.
    <section id="hero-start" className="hero-v2">
      {/* Assignment: Headline block with kicker and “Shop Now” jump link */}
      <div className="hero-headline">
        <div
          className="hero-title-row"
          style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}
        >
          <div className="hero-title-wrap">
            <div className="kicker">{pretty(normCat)}</div>
            <h1 className="hero-title" style={{margin:0}}>{picks.headline}</h1>
          </div>
          {/* CTA intentionally points to products list */}
          <a href="#products-start" className="btn btn-primary btn-slim" style={{whiteSpace:'nowrap', marginLeft:'auto'}}>
            Shop Now
          </a>
        </div>
      </div>

      {/* Assignment: Promo grid — one promo card + four dynamic picks */}
      <div className="promo-grid">
        {/* Offer tile: it’s giving “marketing”, but conveniently non-intrusive */}
        <div className="promo-card soft">
          <div style={{fontWeight:800, fontSize:'18px', lineHeight:1.2}}>
            Use code <code>REACT20</code> for 20% OFF.
          </div>
          <div className="promo-btn">Special Offer</div>
        </div>

        {/* Cards 1–4: each image uses a placeholder fallback and onError handler.
            Translation: if the API serves a blank stare, your UI still looks flawless. */}
        <Link to={link1} className="promo-card">
          <div className="promo-img">
            <img src={c1?.image || FALLBACK} alt="" onError={(e)=>{ e.currentTarget.src = FALLBACK }} />
          </div>
          <div className="promo-overlay">{l1}</div>
        </Link>

        <Link to={link2} className="promo-card tall">
          <div className="promo-img">
            <img src={c2?.image || FALLBACK} alt="" onError={(e)=>{ e.currentTarget.src = FALLBACK }} />
          </div>
          <div className="promo-overlay">{l2}</div>
        </Link>

        <Link to={link3} className="promo-card">
          <div className="promo-img">
            <img src={c3?.image || FALLBACK} alt="" onError={(e)=>{ e.currentTarget.src = FALLBACK }} />
          </div>
          <div className="promo-overlay">{l3}</div>
        </Link>

        <Link to={link4} className="promo-card">
          <div className="promo-img">
            <img src={c4?.image || FALLBACK} alt="" onError={(e)=>{ e.currentTarget.src = FALLBACK }} />
          </div>
          <div className="promo-overlay">{l4}</div>
        </Link>
      </div>
    </section>
  )
}
