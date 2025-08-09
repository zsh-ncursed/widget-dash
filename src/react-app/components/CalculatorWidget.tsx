import { useState, useEffect } from 'react';
import WidgetTitle from './WidgetTitle';

export default function CalculatorWidget({ widgetId }: { widgetId: string }) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = 0;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          result = currentValue / inputValue;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    performOperation('');
    setOperation(null);
    setPreviousValue(null);
    setWaitingForOperand(true);
  };

  // Обработчик клавиатурных событий
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Игнорируем события, если фокус в input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        // Цифры (обычные и numpad)
        case '0':
        case 'Numpad0':
          inputNumber('0');
          break;
        case '1':
        case 'Numpad1':
          inputNumber('1');
          break;
        case '2':
        case 'Numpad2':
          inputNumber('2');
          break;
        case '3':
        case 'Numpad3':
          inputNumber('3');
          break;
        case '4':
        case 'Numpad4':
          inputNumber('4');
          break;
        case '5':
        case 'Numpad5':
          inputNumber('5');
          break;
        case '6':
        case 'Numpad6':
          inputNumber('6');
          break;
        case '7':
        case 'Numpad7':
          inputNumber('7');
          break;
        case '8':
        case 'Numpad8':
          inputNumber('8');
          break;
        case '9':
        case 'Numpad9':
          inputNumber('9');
          break;

        // Операции
        case '+':
        case 'NumpadAdd':
          performOperation('+');
          break;
        case '-':
        case 'NumpadSubtract':
          performOperation('-');
          break;
        case '*':
        case 'NumpadMultiply':
          performOperation('*');
          break;
        case '/':
        case 'NumpadDivide':
          performOperation('/');
          break;

        // Десятичная точка
        case '.':
        case 'NumpadDecimal':
          inputDecimal();
          break;

        // Enter и равно
        case 'Enter':
        case 'NumpadEnter':
        case '=':
          calculate();
          break;

        // Escape и C для очистки
        case 'Escape':
        case 'c':
        case 'C':
          clear();
          break;

        // Backspace для удаления последнего символа
        case 'Backspace':
          setDisplay(display.slice(0, -1) || '0');
          break;

        default:
          return;
      }

      // Предотвращаем стандартное поведение для обработанных клавиш
      event.preventDefault();
    };

    // Добавляем обработчик только когда виджет активен
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [display, waitingForOperand, operation, previousValue]);

  const buttonClass = "w-full h-10 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium";
  const operatorClass = "w-full h-10 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium";
  const equalsClass = "w-full h-10 rounded bg-green-500 hover:bg-green-600 text-white transition-colors text-sm font-medium";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <WidgetTitle widgetId={widgetId} defaultTitle="Calculator" />
      {/* Display */}
      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
        <div className="text-right text-xl font-mono text-gray-900 dark:text-gray-100 overflow-hidden">
          {display}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button onClick={clear} className={buttonClass}>C</button>
        <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className={buttonClass}>⌫</button>
        <button onClick={() => performOperation('/')} className={operatorClass}>÷</button>
        <button onClick={() => performOperation('*')} className={operatorClass}>×</button>

        {/* Row 2 */}
        <button onClick={() => inputNumber('7')} className={buttonClass}>7</button>
        <button onClick={() => inputNumber('8')} className={buttonClass}>8</button>
        <button onClick={() => inputNumber('9')} className={buttonClass}>9</button>
        <button onClick={() => performOperation('-')} className={operatorClass}>−</button>

        {/* Row 3 */}
        <button onClick={() => inputNumber('4')} className={buttonClass}>4</button>
        <button onClick={() => inputNumber('5')} className={buttonClass}>5</button>
        <button onClick={() => inputNumber('6')} className={buttonClass}>6</button>
        <button onClick={() => performOperation('+')} className={operatorClass}>+</button>

        {/* Row 4 */}
        <button onClick={() => inputNumber('1')} className={buttonClass}>1</button>
        <button onClick={() => inputNumber('2')} className={buttonClass}>2</button>
        <button onClick={() => inputNumber('3')} className={buttonClass}>3</button>
        <button onClick={calculate} className={`${equalsClass} row-span-2`} style={{ gridRow: 'span 2' }}>
          =
        </button>

        {/* Row 5 */}
        <button onClick={() => inputNumber('0')} className={`${buttonClass} col-span-2`} style={{ gridColumn: 'span 2' }}>
          0
        </button>
        <button onClick={inputDecimal} className={buttonClass}>.</button>
      </div>
    </div>
  );
}
