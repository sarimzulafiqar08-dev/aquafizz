import { useEffect } from 'react'

export function usePageSeo({ title, description }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let tag = document.querySelector('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'description')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', description)
    }
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle && title) ogTitle.setAttribute('content', title)
  }, [title, description])
}
