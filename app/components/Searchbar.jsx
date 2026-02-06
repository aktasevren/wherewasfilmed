'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchMovies, getLocations } from '@/lib/redux/actions/MovieActions';
import { getAlertify } from '@/lib/alertify';
import { Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

const SUGGESTION_DELAY_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 40;
const SUGGESTION_PAGE_SIZE = 15;
const AUTO_LOAD_PAGES = 5;

function SuggestionItem({ item, onClick }) {
  return (
    <li
      role="option"
      aria-selected="false"
      className="search-suggestion-item"
      onClick={() => onClick(item)}
      onMouseDown={(e) => e.preventDefault()}
    >
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt=""
          className="search-suggestion-poster"
          width={44}
          height={66}
        />
      ) : (
        <div className="search-suggestion-poster-placeholder" aria-hidden="true">
          <span className="search-suggestion-poster-placeholder-icon">🎬</span>
        </div>
      )}
      <div className="search-suggestion-info">
        <span className="search-suggestion-title">
          {item.title || item.original_title}
        </span>
        <span className="search-suggestion-meta">
          {item.year && `${item.year}`}
          {item.yr && ` (${item.yr})`}
        </span>
      </div>
      <span className={`search-suggestion-badge search-suggestion-badge--${item.type}`}>
        {item.type === 'movie' ? 'Movie' : 'Series'}
      </span>
    </li>
  );
}

export default function Searchbar() {
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
    setShowDropdown(false);
    if (!inputText?.trim()) {
      const alertify = await getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please type something.');
      }
      return;
    }
    dispatch(fetchMovies(inputText.trim()));
    router.push(`/search/${encodeURIComponent(inputText.trim())}`);
  };

  const onSelectSuggestion = (item) => {
    setShowDropdown(false);
    setInputText('');
    setMovies([]);
    setSeries([]);
    const id = item.wikidata_id || item.id;
    dispatch(getLocations(id, item));
    router.push(`/movie/${id}`);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleDropdownScroll = (e) => {
    if (loading || loadingMore) return;
    if (!nextContinue) return;
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    const q = inputText.trim();
    if (!nearBottom || !q || q.length < MIN_QUERY_LENGTH) return;
    // Guard: query changed while scrolling
    if (queryRef.current && queryRef.current !== q) return;
    fetchSuggestions(q, nextContinue, true);
  };

  return (
    <Row className="searchbar">
      <Col xs={12} sm={11} md={11} lg={10} xl={10} className="mx-auto">
        <div className="searchbar-wrapper" ref={dropdownRef}>
          <InputGroup className="search-input-group">
            <span className="search-input-icon" aria-hidden="true">
              ⌕
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

          {showDropdown && (hasSuggestions || loading) && (
            <div
              id="search-suggestions-list"
              className="search-suggestions-dropdown"
              role="listbox"
              onScroll={handleDropdownScroll}
            >
              {loading ? (
                <div className="search-suggestions-loading">Loading...</div>
              ) : (
                <>
                  {movies.length > 0 && (
                    <div className="search-suggestions-section">
                      <h3 className="search-suggestions-section-title search-suggestions-section-title--movie">
                        Movies
                      </h3>
                      <ul className="search-suggestions-list">
                        {movies.map((item) => (
                          <SuggestionItem
                            key={item.id}
                            item={item}
                            onClick={onSelectSuggestion}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                  {series.length > 0 && (
                    <div className="search-suggestions-section">
                      <h3 className="search-suggestions-section-title search-suggestions-section-title--series">
                        Series
                      </h3>
                      <ul className="search-suggestions-list">
                        {series.map((item) => (
                          <SuggestionItem
                            key={item.id}
                            item={item}
                            onClick={onSelectSuggestion}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                  {!loadingMore && nextContinue && (
                    <button
                      type="button"
                      className="search-suggestions-load-more"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => fetchSuggestions(inputText.trim(), nextContinue, true)}
                    >
                      Daha fazlası
                    </button>
                  )}
                  {loadingMore && (
                    <div className="search-suggestions-loading">Loading more...</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
}
