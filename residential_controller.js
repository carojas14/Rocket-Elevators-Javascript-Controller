const { times } = require("lodash");

let elevatorID = 1;

let callButtonID = 1;



class Column {
    constructor(_id, _amountOfFloors, _amountOfElevators) {
        this.ID = _id;
        this.status = 'online';
        this.elevatorList = [];
        this.callButtonList = [];

        this.createElevators(_amountOfElevators, _amountOfElevators);
        this.createCallButtons(_amountOfFloors);
    }


    createCallButtons(_amountOfFloors) {
        let buttonFloor = 1;

        for(let i=0; i<_amountOfFloors; i++) {
            if (buttonFloor < _amountOfFloors) {
                let callButton = new CallButton(callButtonID, "OFF", buttonFloor, "up");
                this.callButtonList.push(callButton);
                callButtonID++;
            }


            if (buttonFloor > 1) {
                let callButton = new CallButton(callButtonID, "OFF", buttonFloor, "down");
                this.callButtonList.push(callButton);
                callButtonID++;
            }
            buttonFloor++;

            /* if (buttonFloor === 1) {
                this.callButtonList.push(new CallButton(callButtonID, buttonFloor, 'up'));
            } else if (buttonFloor < _amountOfFloors && buttonFloor != 1) {
                this.callButtonList.push(new CallButton(callButtonID, buttonFloor, 'up'));
                callButtonID++;
                this.callButtonList.push(new CallButton(callButtonID, buttonFloor, 'down'));
            } else {
                this.callButtonList.push(new CallButton(callButtonID, buttonFloor, 'down'));
            }
            callButtonID++;
            buttonFloor++; */
        }
    }


    createElevators(_amountOfFloors, _amountOfElevators) {
        for(let i=0; i<_amountOfElevators; i++) {
            let elevator = new Elevator(elevatorID, _amountOfFloors);
            this.elevatorList.push(elevator);
            elevatorID++;
        }
    }


    requestElevator(floor, direction) {
        let elevator = this.findElevator(floor, direction);
        elevator.floorRequestList.push(floor);
        elevator.move();
        elevator.door.status = 'opened';
        //elevator.operateDoors();
        return elevator;
    }


    findElevator(requestedFloor, requestedDirection) {
        let bestElevator;
        let bestScore = 5;
        let referenceGap = 10000000;
        let bestElevatorInformations;

        this.elevatorList.forEach(elevator => {
            //The elevator is at my floor and going in the direction I want
            if (requestedFloor === elevator.currentFloor && elevator.status === 'stopped' && requestedDirection === elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, elevator, bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is lower than me, is coming up and I want to go up
            }else if (requestedFloor > elevator.currentFloor && elevator.direction === 'down' && requestedDirection === elevator.direction){
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is higher than me, is coming down and I want to go down
            }else if (requestedFloor < elevator.currentFloor && elevator.direction === 'up' && requestedDirection === elevator.direction){
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is idle
            } else if (elevator.status === 'idle') {
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestScore, referenceGap, bestElevator, requestedFloor);
            } else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, elevator, bestScore, referenceGap, bestElevator, requestedFloor);
            }

            bestElevator = bestElevatorInformations.bestElevator;
            bestScore = bestElevatorInformations.bestScore;
            referenceGap = bestElevatorInformations.referenceGap;
        });
        return bestElevator;
    }


    checkIfElevatorIsBetter (scoreToCheck, newElevator, bestScore, referenceGap, bestElevator, floor) {

        if (scoreToCheck < bestScore) {
            bestScore = scoreToCheck;
            bestElevator = newElevator;
            referenceGap = Math.abs(newElevator.currentFloor - floor);
        } else if (bestScore === scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor);
            if (referenceGap > gap) {
                bestElevator = newElevator;
                referenceGap = gap;
            }
        }

        return {
            bestElevator,
            bestScore,
            referenceGap
        };
    }
}

class Elevator {
    constructor(_id, _status, _amountOfFloors, _currentFloor) {
        this.ID = _id;
        this.status = _status;
        this.amountOfFloors = _amountOfFloors;
        this.currentFloor = _currentFloor;
        this.direction = null;
        this.door = new Door(_id, 'closed');
        this.floorRequestButtonList = [];
        this.floorRequestList = [];

        this.createFloorRequestButtons(this.amountOfFloors);
    }


    createFloorRequestButtons(_amountOfFloors) {
        let buttonFloor = 1;
        let buttonID = 1;

        for(let i=0; i<_amountOfFloors; i++) {
            let floorRequestButton = new FloorRequestButton(buttonID, buttonFloor);
            console.log(floorRequestButton);
            this.floorRequestButtonList.push(floorRequestButton);
            buttonFloor++;
            buttonID++;
        }
    }


    requestFloor(requestedFloor) {
        this.floorRequestList.push(requestedFloor);
        this.move();
        this.door.status = 'opened';
        //this.operateDoors();
    }


    move() {
        while (this.floorRequestList.length !== 0) {
            let destination = this.floorRequestList[0];
            this.status = 'moving';
            if (this.currentFloor < destination) {
                this.direction = 'up';
                this.sortFloorList();
                while (this.currentFloor < destination) {
                    this.currentFloor++;
                    this.screenDisplay = this.currentFloor;
                }
            } else if (this.currentFloor > destination) {
                this.direction = 'down';
                this.sortFloorList();
                while (this.currentFloor > destination) {
                    this.currentFloor--;
                    this.screenDisplay = this.currentFloor;
                }
            }
            this.status = 'stopped';
            this.floorRequestList.shift();
        }
        this.status = 'idle';
    }


    sortFloorList() {
        if (this.direction === 'up') {
            this.floorRequestList.sort();
        } else {
            this.floorRequestList.sort();
            this.floorRequestList.reverse();
        }
    }


    /* operateDoors() {
        this.door.status = 'opened';
        setTimeout("wait", 5000);
        if (Elevator != 'overweight') {
            this.door.status = 'closing';
            if (!'obstruction') {
                this.door.status = 'closed';
            } else {
                this.operateDoors();
            }
        } else {
            while (Elevator == 'overweight') {
                'Activate overweight alarm';
            }
            this.operateDoors();
        }
    } */
}

class CallButton {
    constructor(_id, _floor, _direction) {
        this.ID = _id;
        this.status = "ON";
        this.floor = _floor;
        this.direction = _direction;
    }
}

class FloorRequestButton {
    constructor(_id, _floor) {
        this.ID = _id;
        //this.status = "OFF";
        this.floor = _floor;
    }
}

class Door {
    constructor(_id, _status) {
        this.ID = _id;
        this.status = _status;
    }
}




module.exports = { Column, Elevator, CallButton, FloorRequestButton, Door }


