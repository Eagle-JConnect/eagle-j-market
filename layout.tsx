import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'Eagle-J Market | Digital Marketing',description:'Promote your business, reach more customers and increase sales with Eagle-J Market.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
