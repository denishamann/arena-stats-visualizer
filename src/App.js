import Papa from "papaparse";
import React, { useState } from "react";
import Modal from "./modal";
import useModal from "./useModal";

export default function App() {
  const { isShowing: isImportFormShowed, toggle: toggleImportForm } =
    useModal();

  const [importString, setImportString] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [statsForEachComposition, setStatsForEachComposition] = useState([]);

  const importConfirmed = () => {
    const result = Papa.parse(importString);
    const dataWithoutSkirm = cleanTitlesAndSkirmishes(result.data);
    const only2sData = cleanNon2sData(dataWithoutSkirm);
    const totalMatches = only2sData.length;
    setTotalMatches(totalMatches);
    const totalWins = getTotalWins(only2sData);
    setTotalWins(totalWins);

    const possibleCompositions = getAllPossibleCompositions(only2sData);

    const statsForEachComposition = getStatsForEachComposition(
      only2sData,
      possibleCompositions
    );

    setStatsForEachComposition(statsForEachComposition);

    toggleImportForm();
  };

  const cleanTitlesAndSkirmishes = (data) => {
    data.shift();
    return data.filter((row) => row[0] !== "NO");
  };

  const cleanNon2sData = (data) => {
    return data.filter((row) => row[10] === "");
  };

  const getTotalWins = (data) => {
    return data.filter((row) => {
      if ((row[6] && row[7] && row[6] === row[7]) || row[29] > 0) {
        return true;
      }
      return false;
    }).length;
  };

  const getAllPossibleCompositions = (data) => {
    const compositions = new Set();
    data.forEach((row) => {
      if (row[37] && row[38] && row[37].localeCompare(row[38])) {
        compositions.add(`${row[37]}+${row[38]}`);
      } else if (row[37] && row[38]) {
        compositions.add(`${row[38]}+${row[37]}`);
      }
    });
    compositions.delete("+");
    return Array.from(compositions);
  };

  const getStatsForEachComposition = (data, possibleCompositions) => {
    return possibleCompositions
      .map((comp) => {
        let total = 0;
        let wins = 0;
        data.forEach((row) => {
          if (
            `${row[37]}+${row[38]}` === comp ||
            `${row[37]}+${row[38]}` === comp
          ) {
            total++;
            if ((row[6] && row[7] && row[6] === row[7]) || row[29] > 0) {
              wins++;
            }
          }
        });
        return {
          comp,
          total,
          wins,
        };
      })
      .sort((a, b) => {
        return b.total - a.total;
      });
  };

  return (
    <>
      <div className="App">
        <button className="modal-toggle" onClick={toggleImportForm}>
          Import
        </button>

        <p>
          Notice: It automatically removes all skirmished and all non 2s matches
          for now
        </p>
        <strong>Total matches: {totalMatches}</strong>
        <br />
        <strong className="total-wins">Total wins: {totalWins}</strong>
        <table className="data-table">
          <tbody>
            <tr>
              <th>Composition</th>
              <th>Total matches</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Ratio</th>
            </tr>
            {statsForEachComposition.map((item, i) => (
              <tr key={i}>
                <td>{item.comp}</td>
                <td>{item.total}</td>
                <td>{item.wins}</td>
                <td>{item.total - item.wins}</td>
                <td>{item.wins / item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal
          isShowing={isImportFormShowed}
          hide={toggleImportForm}
          title="Import"
        >
          <div className="form-group">
            <textarea
              rows="20"
              cols="60"
              value={importString}
              onChange={(e) => setImportString(e.target.value)}
            ></textarea>
          </div>
          <div className="form-group">
            <button className="import-confirmed" onClick={importConfirmed}>
              Import
            </button>
          </div>
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
          background-color: turquoise;
          cursor: pointer;
          padding: 1rem 2rem;
          text-transform: uppercase;
          border: none;
        }

        button.modal-toggle:not(:first-child) {
          margin-left: 10px;
        }

        .form-group {
          margin-top: 10px;
        }
        .total-wins {
          margin-bottom: 10px;
          color: green;
        }
        .data-table {
          margin-top: 10px;
        }
      `}</style>
    </>
  );
}
