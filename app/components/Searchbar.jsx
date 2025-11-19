'use client';

import { React, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchMovies } from '@/lib/redux/actions/MovieActions';
import { Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

// alertifyjs'i dinamik olarak import et
const getAlertify = () => {
  if (typeof window !== 'undefined') {
    return require('alertifyjs');
  }
  return null;
};

export default function Searchbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [inputText, setInputText] = useState('');

  const onChange = (e) => {
    setInputText(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (inputText === '' || inputText === null || inputText === undefined) {
      const alertify = getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please type something.');
      }
    } else {
      dispatch(fetchMovies(inputText));
      router.push(`/search/${inputText}`);
    }
  };

  return (
    <Row className="searchbar">
      <Col xs={12} sm={10} md={8} lg={6} xl={5} className="mx-auto">
        <InputGroup className="search-input-group" onChange={onChange}>
          <Form.Control 
            placeholder="Type a movie name ..." 
            value={inputText}
            onChange={onChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSubmit(e);
              }
            }}
            className="search-input"
          />
          <Button onClick={onSubmit} className="search-button">
            <b>Search</b>
          </Button>
        </InputGroup>
      </Col>
    </Row>
  );
}

