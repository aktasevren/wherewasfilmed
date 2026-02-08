'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getLocations } from '@/lib/redux/actions/MovieActions';
import { getAlertify } from '@/lib/alertify';
import { encodeMovieId } from '@/lib/movieId';
import { Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import { IconSearch, IconArrowForward, IconExpandMore } from '@/app/components/Icons';

const SUGGESTION_DELAY_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 40;
const SUGGESTION_PAGE_SIZE = 15;
/** İlk 5 continue sayfası otomatik yüklenir; 6. sayfadan itibaren sadece "Daha fazlası" ile yüklenir */
const AUTO_LOAD_PAGES = 5;

const SuggestionItem = React.memo(function SuggestionItem({ item, onClick, glass }) {
  const title = item.title || item.original_title || '';
  const subtitle = item.year ? String(item.year) : (item.yr ? String(item.yr) : '');

  if (glass) {
    return (
      <div
        role="option"
        aria-selected="false"
        className="hover:bg-white/5 rounded-2xl p-3 flex items-center gap-4 cursor-pointer transition-colors group"
        onClick={() => onClick(item)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10">
          {item.poster_url ? (
            <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl">🎬</div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="text-lg font-bold group-hover:text-primary transition-colors truncate">{title}</h4>
          <p className="text-sm text-white/50">{subtitle ? `• ${subtitle}` : ''}</p>
        </div>
        <span className="text-white/20 group-hover:text-primary transition-colors shrink-0">
          <IconArrowForward size={18} />
        </span>
      </div>
    );
  }

  return (
    <li
      role="option"
      aria-selected="false"
      className="search-suggestion-item"
      onClick={() => onClick(item)}
      onMouseDown={(e) => e.preventDefault()}
    >
      {item.poster_url ? (
        <img src={item.poster_url} alt="" className="search-suggestion-poster" width={44} height={66} />
      ) : (
        <div className="search-suggestion-poster-placeholder" aria-hidden="true">
          <span className="search-suggestion-poster-placeholder-icon">🎬</span>
        </div>
      )}
      <div className="search-suggestion-info">
        <span className="search-suggestion-title">{title}</span>
        <span className="search-suggestion-meta">{item.year && `${item.year}`}{item.yr && ` (${item.yr})`}</span>
      </div>
      <span className={`search-suggestion-badge search-suggestion-badge--${item.type}`}>
        {item.type === 'movie' ? 'Movie' : 'Series'}
      </span>
    </li>
  );
});

export default function Searchbar({ variant }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [inputText, setInputText] = useState('');
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextContinue, setNextContinue] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const queryRef = useRef('');

  const hasSuggestions = movies.length > 0 || series.length > 0;

  const fetchSuggestions = useCallback(async (query, continueOffset = null, append = false) => {
    if (!query || query.length < MIN_QUERY_LENGTH) {
      setMovies([]);
      setSeries([]);
      setNextContinue(null);
      setShowDropdown(false);
      return;
    }
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      queryRef.current = query;
      const res = await fetch(
        `/api/search-suggestions?q=${encodeURIComponent(query)}${
          continueOffset ? `&continue=${encodeURIComponent(String(continueOffset))}` : ''
        }&limit=${SUGGESTION_PAGE_SIZE}`
      );
      const data = await res.json();
      const newMovies = data?.movies ?? [];
      const newSeries = data?.series ?? [];
      let cont = data?.continue ?? null;

      setNextContinue(cont);

      if (append) {
        setMovies((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          const merged = [...prev, ...newMovies.filter((x) => x?.id && !seen.has(x.id))];
          return merged.slice(0, MAX_SUGGESTIONS);
        });
        setSeries((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          const merged = [...prev, ...newSeries.filter((x) => x?.id && !seen.has(x.id))];
          return merged.slice(0, MAX_SUGGESTIONS);
        });
        setShowDropdown(true);
      } else {
        setMovies(newMovies);
        setSeries(newSeries);
        setShowDropdown((newMovies.length ?? 0) + (newSeries.length ?? 0) > 0);
        setLoading(false);
        // İlk sayfa hemen gösterildi; arka planda kalan 4 sayfayı otomatik yükle (toplam 5)
        for (let i = 0; i < AUTO_LOAD_PAGES - 1 && cont != null; i++) {
          if (queryRef.current !== query) break;
          setLoadingMore(true);
          try {
            const nextRes = await fetch(
              `/api/search-suggestions?q=${encodeURIComponent(query)}&continue=${encodeURIComponent(String(cont))}&limit=${SUGGESTION_PAGE_SIZE}`
            );
            const nextData = await nextRes.json();
            const moreMovies = nextData?.movies ?? [];
            const moreSeries = nextData?.series ?? [];
            cont = nextData?.continue ?? null;
            setNextContinue(cont);
            setMovies((prev) => {
              const seen = new Set(prev.map((x) => x.id));
              const merged = [...prev, ...moreMovies.filter((x) => x?.id && !seen.has(x.id))];
              return merged.slice(0, MAX_SUGGESTIONS);
            });
            setSeries((prev) => {
              const seen = new Set(prev.map((x) => x.id));
              const merged = [...prev, ...moreSeries.filter((x) => x?.id && !seen.has(x.id))];
              return merged.slice(0, MAX_SUGGESTIONS);
            });
            setShowDropdown(true);
          } catch {
            break;
          }
        }
        setLoadingMore(false);
        return;
      }
    } catch {
      setMovies([]);
      setSeries([]);
      setNextContinue(null);
      setShowDropdown(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!inputText.trim()) {
      setMovies([]);
      setSeries([]);
      setNextContinue(null);
      setShowDropdown(false);
      return;
    }
    if (inputText.trim().length < MIN_QUERY_LENGTH) {
      setMovies([]);
      setSeries([]);
      setNextContinue(null);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputText.trim(), null, false);
    }, SUGGESTION_DELAY_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputText, fetchSuggestions]);

  const onChange = (e) => {
    setInputText(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!inputText?.trim()) {
      const alertify = await getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please type something.');
      }
      return;
    }
    setShowDropdown(true);
  };

  const onSelectSuggestion = (item) => {
    setShowDropdown(false);
    setInputText('');
    setMovies([]);
    setSeries([]);
    const id = item.wikidata_id || item.id;
    const encoded = encodeMovieId(id);
    dispatch(getLocations(encoded, item));
    router.push(`/movie/${encoded}`);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  /** Sadece "Daha fazlası" butonu ile yükleme; scroll ile otomatik yükleme yok (ilk 5 sayfa zaten otomatik) */
  const handleLoadMore = () => {
    const q = inputText.trim();
    if (!q || q.length < MIN_QUERY_LENGTH || loading || loadingMore || !nextContinue) return;
    if (queryRef.current !== q) return;
    fetchSuggestions(q, nextContinue, true);
  };

  const allSuggestions = [...movies, ...series];
  const useGlassDropdown = variant === 'hero';

  const dropdownContent = showDropdown && (hasSuggestions || loading) && (
    <div
      id="search-suggestions-list"
      className={`search-suggestions-dropdown ${useGlassDropdown ? 'glass-dropdown rounded-b-3xl rounded-t-lg mt-2 py-2' : ''}`}
      role="listbox"
    >
      {loading ? (
        <div className="search-suggestions-loading">Loading...</div>
      ) : useGlassDropdown ? (
        <>
          <div className="px-4 py-2 max-h-[320px] overflow-y-auto">
            {allSuggestions.map((item) => (
              <SuggestionItem
                key={item.id}
                item={item}
                onClick={onSelectSuggestion}
                glass
              />
            ))}
          </div>
          {!loadingMore && nextContinue && (
            <div className="p-4 border-t border-white/5 bg-white/5 flex justify-center">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors group"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleLoadMore}
              >
                Load More Results
                <IconExpandMore size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
          {loadingMore && (
            <div className="p-4 border-t border-white/5 text-center text-sm text-white/50">Loading more...</div>
          )}
        </>
      ) : (
        <>
          {movies.length > 0 && (
            <div className="search-suggestions-section">
              <h3 className="search-suggestions-section-title search-suggestions-section-title--movie">Movies</h3>
              <ul className="search-suggestions-list">
                {movies.map((item) => (
                  <SuggestionItem key={item.id} item={item} onClick={onSelectSuggestion} />
                ))}
              </ul>
            </div>
          )}
          {series.length > 0 && (
            <div className="search-suggestions-section">
              <h3 className="search-suggestions-section-title search-suggestions-section-title--series">Series</h3>
              <ul className="search-suggestions-list">
                {series.map((item) => (
                  <SuggestionItem key={item.id} item={item} onClick={onSelectSuggestion} />
                ))}
              </ul>
            </div>
          )}
          {!loadingMore && nextContinue && (
            <button
              type="button"
              className="search-suggestions-load-more"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLoadMore}
            >
              Daha fazlası
            </button>
          )}
          {loadingMore && <div className="search-suggestions-loading">Loading more...</div>}
        </>
      )}
    </div>
  );

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-3xl relative group mb-20 mx-auto z-40" ref={dropdownRef}>
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
        <div
          className={`relative flex items-center bg-[#151525] border border-white/10 p-2 hero-glow ${
            showDropdown && (hasSuggestions || loading) ? 'rounded-t-3xl rounded-b-lg border-b-white/20' : 'rounded-full'
          }`}
        >
          <div className="pl-6 pr-4 text-white/40">
            <IconSearch size={28} className="text-3xl" />
          </div>
          <input
            type="text"
            placeholder="Find your favorite movie or TV show..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={handleBlur}
            onFocus={() => hasSuggestions && setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit(e);
              if (e.key === 'Escape') setShowDropdown(false);
            }}
            className="w-full bg-transparent border-none focus:ring-0 text-xl py-4 placeholder:text-white/20 font-light outline-none text-white"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions-list"
            aria-label="Search movies and series"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-full font-bold transition-all mr-1 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Search'}
          </button>
        </div>
        {dropdownContent}
      </div>
    );
  }

  return (
    <Row className="searchbar">
      <Col xs={12} sm={11} md={11} lg={10} xl={10} className="mx-auto">
        <div className="searchbar-wrapper" ref={dropdownRef}>
          <InputGroup className="search-input-group">
            <span className="search-input-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <Form.Control
              placeholder="Search a movie or series..."
              value={inputText}
              onChange={onChange}
              onBlur={handleBlur}
              onFocus={() => hasSuggestions && setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit(e);
                if (e.key === 'Escape') setShowDropdown(false);
              }}
              className="search-input"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              aria-controls="search-suggestions-list"
              aria-label="Search movies and series"
            />
            <Button
              onClick={onSubmit}
              className="search-button"
              type="button"
              aria-label="Search"
              disabled={loading}
            >
              <b>{loading ? 'Loading…' : 'Search'}</b>
            </Button>
          </InputGroup>
          {dropdownContent}
        </div>
      </Col>
    </Row>
  );
}
