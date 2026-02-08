'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import AppHeader from '@/app/components/AppHeader';
import Searchbar from '@/app/components/Searchbar';
import SearchedMovies from '@/app/components/SearchedMovies';
import Footer from '@/app/components/Footer';
import { fetchMovies } from '@/lib/redux/actions/MovieActions';

export default function SearchPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const searchText = params.text;

  useEffect(() => {
    if (searchText) {
      dispatch(fetchMovies(searchText));
    }
  }, [searchText, dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <AppHeader />
      <main className="pt-24 flex-1">
        <section aria-label="Search movies">
          <Searchbar />
        </section>
        <section aria-label={`Search results for: ${searchText}`}>
          <SearchedMovies />
        </section>
      </main>
      <Footer />
    </div>
  );
}

