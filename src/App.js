import 'bootstrap/dist/css/bootstrap.css';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import Papa from 'papaparse';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row as BootstrapRow,
  Table,
} from 'react-bootstrap';
import { MyBadge } from './MyBadge';
import { Row } from './Row';

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [importString, setImportString] = useState('');
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [statsForEachComposition, setStatsForEachComposition] = useState([]);
  const [corruptedCount, setCorruptedCount] = useState(0);
  const [badges, setBadges] = useState([]);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const importConfirmed = () => {
    const result = Papa.parse(importString).data.map(row => new Row(row));
    const dataWithoutSkirm = cleanTitlesAndSkirmishes(result);
    const dataOnlyS3 = getOnlyS3Data(dataWithoutSkirm);
    const cleanData = cleanCorruptedData(dataOnlyS3);
    console.log(dataOnlyS3.filter(x => !cleanData.includes(x)));
    setCorruptedCount(dataOnlyS3.length - cleanData.length);
    const only2sData = cleanNon2sData(cleanData);
    const possibleCompositions = getAllPossibleCompositions(only2sData);
    const statsForEachComposition = getStatsForEachComposition(
      only2sData,
      possibleCompositions
    );

    setTotalMatches(
      statsForEachComposition.reduce((prev, curr) => prev + curr.total, 0)
    );
    setTotalWins(
      statsForEachComposition.reduce((prev, curr) => prev + curr.wins, 0)
    );

    setBadges(computeBadges(only2sData));

    setStatsForEachComposition(statsForEachComposition);
    handleCloseModal();
  };

  const cleanTitlesAndSkirmishes = data => {
    data.shift();
    return data.filter(row => row.isRanked !== 'NO');
  };

  const getOnlyS3Data = data => {
    const s3BeginTs = 1642377600; // Monday 17 January 2022 00:00:00
    return data.filter(row => row.startTime > s3BeginTs);
  };

  const cleanNon2sData = data => {
    return data.filter(row => row.teamPlayerName3 === '');
  };

  const cleanCorruptedData = data => {
    return data.filter(
      row =>
        row.enemyPlayerClass1 !== '' &&
        row.enemyPlayerClass2 !== '' &&
        row.enemyFaction !== '' &&
        row.teamPlayerName1 !== '' &&
        row.teamPlayerName2 !== '' &&
        ((row.teamColor && row.winnerColor) || row.diffRating)
    );
  };

  const getAllPossibleCompositions = data => {
    const compositions = new Set();
    data.forEach(row => {
      if (row.enemyPlayerClass1 && row.enemyPlayerClass2) {
        const arr = [row.enemyPlayerClass1, row.enemyPlayerClass2].sort(
          (a, b) => a.localeCompare(b)
        );
        compositions.add(`${arr[0]}+${arr[1]}`);
      }
    });
    return Array.from(compositions).sort((a, b) => a.localeCompare(b));
  };

  const getStatsForEachComposition = (data, possibleCompositions) => {
    const stats = possibleCompositions.map(comp => {
      return {
        comp,
        total: 0,
        wins: 0,
        aTotal: 0,
        aWins: 0,
        hTotal: 0,
        hWins: 0,
      };
    });

    data.forEach(row => {
      const index = stats.findIndex(
        s =>
          s.comp === `${row.enemyPlayerClass1}+${row.enemyPlayerClass2}` ||
          s.comp === `${row.enemyPlayerClass2}+${row.enemyPlayerClass1}`
      );
      if (index !== -1) {
        stats[index].total = stats[index].total + 1;
        if (row.enemyFaction === 'ALLIANCE') {
          stats[index].aTotal = stats[index].aTotal + 1;
        } else if (row.enemyFaction === 'HORDE') {
          stats[index].hTotal = stats[index].hTotal + 1;
        }
        if (won(row)) {
          stats[index].wins = stats[index].wins + 1;
          if (row.enemyFaction === 'ALLIANCE') {
            stats[index].aWins = stats[index].aWins + 1;
          } else if (row.enemyFaction === 'HORDE') {
            stats[index].hWins = stats[index].hWins + 1;
          }
        }
      } else {
        console.log('error with row', row);
      }
    });

    return stats.sort((a, b) => b.total - a.total);
  };

  const computeBadges = data => {
    let myBadges = [];
    const allClasses = [
      'WARRIOR',
      'PALADIN',
      'HUNTER',
      'SHAMAN',
      'ROGUE',
      'DRUID',
      'PRIEST',
      'MAGE',
      'WARLOCK',
    ];
    allClasses.forEach(currentClass => {
      const currentClassMatches = data.filter(
        row =>
          row.enemyPlayerClass1 === currentClass ||
          row.enemyPlayerClass2 === currentClass ||
          row.enemyPlayerClass3 === currentClass ||
          row.enemyPlayerClass4 === currentClass ||
          row.enemyPlayerClass5 === currentClass
      );
      const currentClassWinRate =
        currentClassMatches.filter(row => won(row)).length /
        currentClassMatches.length;
      if (currentClassWinRate > 0.53) {
        myBadges.push(
          new MyBadge(
            `Good against ${currentClass.toLowerCase()}`,
            `Win rate is ${(currentClassWinRate * 100).toFixed(1)}%`,
            'success'
          )
        );
      }
      if (currentClassWinRate < 0.47) {
        myBadges.push(
          new MyBadge(
            `Bad against ${currentClass.toLowerCase()}`,
            `Win rate is ${(currentClassWinRate * 100).toFixed(1)}%`,
            'danger'
          )
        );
      }
    });
    const longestMatch = maxBy(data, row => row.endTime - row.startTime);
    console.log(longestMatch);
    const shortestMatch = minBy(data, row => row.endTime - row.startTime);
    myBadges.push(
      new MyBadge(
        `Longest match duration ${secondsToHms(
          longestMatch.endTime - longestMatch.startTime
        )}`,
        matchSummary(longestMatch),
        'primary'
      )
    );
    myBadges.push(
      new MyBadge(
        `Shortest match lasted ${secondsToHms(
          shortestMatch.endTime - shortestMatch.startTime
        )}`,
        matchSummary(shortestMatch),
        'primary'
      )
    );
    const meanDur = secondsToHms(
      mean(data.map(row => row.endTime - row.startTime))
    );
    const medianDur = secondsToHms(
      median(data.map(row => row.endTime - row.startTime))
    );
    myBadges.push(
      new MyBadge(
        'Match duration trends',
        `Mean match duration: ${meanDur}, Median match duration: ${medianDur}`,
        'primary'
      )
    );
    myBadges.push(
      new MyBadge(
        `Longest winning streak`,
        `${longestSequence(
          data.map(row => won(row)),
          true
        )} victories in a row!`,
        'success'
      )
    );
    myBadges.push(
      new MyBadge(
        `Longest losing streak`,
        `${longestSequence(
          data.map(row => won(row)),
          false
        )} defeats in a row :(`,
        'danger'
      )
    );

    return myBadges;
  };

  const won = row =>
    (row.teamColor && row.winnerColor && row.teamColor === row.winnerColor) ||
    row.diffRating > 0 ||
    row.enemyDiffRating < 0;

  function secondsToHms(d) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const s = Math.floor((d % 3600) % 60);
    const m = Math.floor((d % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' min, ' : ' min, ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' sec' : ' sec') : '';
    return hDisplay + mDisplay + sDisplay;
  }

  const mean = array => array.reduce((a, b) => a + b) / array.length;
  const median = array =>
    array.slice().sort((a, b) => a - b)[Math.floor(array.length / 2)];
  const longestSequence = (array, value) => {
    let currentCount = 0;
    let maxCount = 0;
    for (let arrayValue of array) {
      if (arrayValue === value) currentCount++;
      if (arrayValue !== value) {
        maxCount = Math.max(maxCount, currentCount);
        currentCount = 0;
      }
    }
    return maxCount;
  };

  const matchSummary = row => {
    const outcome = won(row) ? 'Victory' : 'Defeat';
    const mmr = row.mmr ? ` at ${row.mmr} MMR` : '';
    const enemies = `${enemy(
      row.enemyPlayerName1,
      row.enemyPlayerClass1
    )} and ${enemy(row.enemyPlayerName2, row.enemyPlayerClass2)}`;
    return `${outcome} as ${row.teamPlayerName1}/${row.teamPlayerName2} vs ${enemies}${mmr}`;
    // could also have shown isRanked/diffRating, day (endTime), zoneId...
  };

  const enemy = (enemyName, enemyClass) =>
    enemyClass
      ? enemyName
        ? `${enemyName} (${enemyClass})`
        : enemyClass
      : enemyName;

  return (
    <>
      <div className="App">
        <Button className="modal-toggle" onClick={handleShowModal}>
          Import
        </Button>

        {!importString ? (
          <Alert key={'notice-trimming'} variant={'primary'}>
            <Alert.Heading>Notice</Alert.Heading>
            It automatically removes all skirmishes and all non 2s matches and
            all matches before season 3 beginning (January, 17th).
          </Alert>
        ) : (
          <div>
            <br />
            <strong>Total matches: {totalMatches}</strong>
            <br />
            <strong className="total-wins">Total wins: {totalWins}</strong>
            <br />
            <strong>
              Total win rate: {((totalWins / totalMatches) * 100).toFixed(2)}%
            </strong>
            <br />
            <br />
            <Table striped bordered hover className="data-table">
              <thead>
                <tr key={'head'}>
                  <th>Enemy composition</th>
                  <th>Total matches</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {statsForEachComposition.map((item, _) => (
                  <tr key={item.comp}>
                    <td>{item.comp}</td>
                    <td>
                      {item.total} (<span className="green">{item.aTotal}</span>{' '}
                      + <span className="red">{item.hTotal}</span>)
                    </td>
                    <td>
                      {item.wins} (<span className="green">{item.aWins}</span> +{' '}
                      <span className="red">{item.hWins}</span>)
                    </td>
                    <td>
                      {item.total - item.wins} (
                      <span className="green">{item.aTotal - item.aWins}</span>{' '}
                      + <span className="red">{item.hTotal - item.hWins}</span>)
                    </td>
                    <td>
                      {(item.wins / item.total).toFixed(2)} (
                      <span className="green">
                        {item.aTotal !== 0
                          ? (item.aWins / item.aTotal).toFixed(2)
                          : '-'}
                      </span>{' '}
                      /{' '}
                      <span className="red">
                        {item.hTotal !== 0
                          ? (item.hWins / item.hTotal).toFixed(2)
                          : '-'}
                      </span>
                      )
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p>
              <span className="green">Green = Alliance</span>{' '}
              <span className="red">Red = Horde</span>
            </p>

            <Container>
              <BootstrapRow
                xs={1}
                sm={2}
                md={2}
                lg={3}
                xl={4}
                xxl={4}
                className="g-4"
              >
                {badges.map(badge => (
                  <Col key={badge.title}>
                    <Card
                      key={badge.title}
                      border={badge.appearance}
                      style={{ width: '18rem' }}
                    >
                      <Card.Header as="h5">{badge.title}</Card.Header>
                      <Card.Body>
                        <Card.Text className="mb-2 text-muted">
                          {badge.details}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </BootstrapRow>
            </Container>
            <br />
            <p>
              Skipped <strong className="red">{corruptedCount}</strong>{' '}
              unprocessable records (not only in 2s). Open console to inspect
              them if needed.
            </p>
          </div>
        )}

        <Modal centered size="lg" show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Import</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Export string from addon</Form.Label>
                <Form.Control
                  autoFocus
                  as="textarea"
                  rows={20}
                  cols={50}
                  value={importString}
                  onChange={e => setImportString(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              className="import-confirmed"
              onClick={importConfirmed}
            >
              Import
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx="true">{`
        .App {
          height: 100vh;
          // display: flex;
          // justify-content: center;
          align-items: center;
        }

        button.modal-toggle,
        .import-confirmed {
          background-color: darkgray;
          cursor: pointer;
          padding: 1rem 2rem;
          text-transform: uppercase;
          border: none;
        }

        button.modal-toggle:not(:first-child) {
          margin-left: 10px;
        }

        .total-wins {
          margin-bottom: 10px;
        }
        .data-table {
          margin-top: 10px;
        }
        .red {
          color: red;
        }
        .green {
          color: green;
        }
      `}</style>
    </>
  );
}
