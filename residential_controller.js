const { isNull } = require("lodash");

class Column {
    constructor(id, amountOfFloors, amountOfElevators) {
        this.ID = id;
        this.status = "online"; // online
        this.elevatorList = [];
        this.callButtonList = [];
        this.createElevators(amountOfFloors, amountOfElevators);
        this.createCallButtons(amountOfFloors);
    }


    /**
     * Create a list of call buttons for each column using CallButton class
     * @param amountOfFloor
     **/
    createCallButtons(amountOfFloors) {
        var buttonFloor = 1;
        let callbuttonID = 1;

        for (let i=1; i<=amountOfFloors; i++) {
            if (buttonFloor < amountOfFloors) {
                //If it's not the last floor
                var callButton = new CallButton(callbuttonID, "OFF", buttonFloor, "Up");
                this.callButtonList.push(callButton);
                callbuttonID++;
            }

            if (buttonFloor > 1) {
                //If it's not the first floor
                var callButton = new CallButton(callbuttonID, "OFF", buttonFloor, "Down");
                this.callButtonList.push(callButton);
                callbuttonID++;
            }
            buttonFloor++;
        }
    }


    /**
     * Create a list of elevators for each column using Elevator class
     * @param amountOfFloor
     **/
    createElevators(amountOfFloors, amountOfElevators) {
        for (let i=0; i<amountOfElevators; i++) {
            let elevatorID = i + 1;
            let elevator = new Elevator(elevatorID, amountOfFloors);
            this.elevatorList.push(elevator);
        }
    }


    /**
     * User press a button outside the elevator
     * @param floor
     * @param direction
     * @return elevator
     **/
    requestElevator(floor, direction) {
        let elevator = this.findElevator(floor, direction);
        elevator.floorRequestList.push(floor);
        elevator.move();
        elevator.operateDoors();
        return elevator;
    }


    /**
     * Find the best elevator
     * @param requestedFloor
     * @param requestedDirection
     * @return bestElevator
     **/
    findElevator(requestedFloor, requestedDirection) {
        let bestScore = 5;
        let referenceGap = 10000000;
        let bestElevator;
        let bestElevatorInformations;

        for (let i = 0; i < this.elevatorList.length; i++) {
            //The elevator is at my floor and going in the direction I want
            if (requestedFloor == this.elevatorList[i].currentFloor && this.elevatorList[i].status == 'stopped' && requestedDirection == this.elevatorList[i].direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, this.elevatorList[i], bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is lower than me, is coming up and I want to go up
            }else if (requestedFloor > this.elevatorList[i].currentFloor && this.elevatorList[i].direction == 'down' && requestedDirection == this.elevatorList[i].direction){
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, this.elevatorList[i], bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is higher than me, is coming down and I want to go down
            }else if (requestedFloor < this.elevatorList[i].currentFloor && this.elevatorList[i].direction == 'up' && requestedDirection == this.elevatorList[i].direction){
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, this.elevatorList[i], bestScore, referenceGap, bestElevator, requestedFloor);
            //The elevator is idle
            } else if (this.elevatorList[i].status === 'idle') {
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, this.elevatorList[i], bestScore, referenceGap, bestElevator, requestedFloor);
            } else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, this.elevatorList[i], bestScore, referenceGap, bestElevator, requestedFloor);
            }
            bestElevator = bestElevatorInformations.bestElevator;
            bestScore = bestElevatorInformations.bestScore;
            referenceGap = bestElevatorInformations.referenceGap;
        }

        return bestElevator;
    }


    /**
     * Called by findElevator to compare current elevator in elevatorList with
     * other elevators and return an object with the best score.
     * @param scoreToCheck
     * @param newElevator
     * @param bestScore
     * @param referenceGap
     * @param bestElevator
     * @param floor
     * @return {bestElevator, bestScore, referenceGap}
     **/
    checkIfElevatorIsBetter(scoreToCheck, newElevator, bestScore, referenceGap, bestElevator, floor) {
        if (scoreToCheck < bestScore) {
            bestScore = scoreToCheck;
            bestElevator = newElevator;
            referenceGap = Math.abs(newElevator.currentFloor - floor);
        } else if (bestScore == scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor);
            if (referenceGap > gap) {
                bestElevator = newElevator;
                referenceGap = gap;
            }
        }
        return {
            bestElevator,
            bestScore,
            referenceGap,
        };
    }
}


class Elevator {
    constructor(id, amountOfFloors) {
        this.ID = id;
        this.status = "idle";
        this.currentFloor = 1;
        this.door = new Door();
        this.floorRequestButtonList = [];
        this.floorRequestList = [];
        this.screenDisplay;

        this.createFloorRequestButtons(amountOfFloors);
    }


    /**
     * Create a list of call floor buttons for each column using FloorRequestButton class
     * @param amountOfFloors
     **/
    createFloorRequestButtons(amountOfFloors) {
        // button inside the elevator
        let buttonFloor = 1;
        for (let i = 0; i < amountOfFloors; i++) {
            let floorRequestButton = new FloorRequestButton(buttonFloor, buttonFloor);
            this.floorRequestButtonList.push(floorRequestButton);
            buttonFloor++;
        }
    }


    /**
     * User press a button inside the elevator
     * Add the floor request to the list
     * Call move()
     * Call operateDoors()
     * @param floor
     **/
    requestFloor(floor) {
        this.floorRequestList.push(floor);
        this.move();
        this.operateDoors();
    }


    /**
     * Move elevator to requested floor
     **/
    move() {
        while (this.floorRequestList.length != 0) {
            let destination = this.floorRequestList[0];
            this.status = "moving";
            //Elevator position is lower than requested floor
            if (this.currentFloor < destination) {
                this.direction = "up";
                this.sortFloorList();

                //Elevator move when it have a request
                while (this.currentFloor < destination) {
                    this.currentFloor++;
                    this.screenDisplay = this.currentFloor;
                    
                }
            //Elevator position is higher than requested floor
            } else if (this.currentFloor > destination) {
                this.direction = "down";
                this.sortFloorList();

                //Elevator move when it have a request
                while (this.currentFloor > destination) {
                    this.currentFloor--;
                    this.screenDisplay = this.currentFloor;
                    
                }
            }

            this.status = "stopped";
            this.floorRequestList.shift();
            
        }
        this.status = "idle";
    }


    /**
     * Sort the list of floor requested according to elevator direction
     * @return floorRequestList
     **/
    sortFloorList() {
        if ((this.direction = "up")) {
            this.floorRequestList.sort(); // sort floorRequestList asc
        } else {
            this.floorRequestList.reverse(); //sort floorRequestList desc
        }
        return this.floorRequestList;
    }


    /**
     * Manage doors
     * opened
     * closed
     **/
    operateDoors() {
        this.door.status = 'opened';
        if (this.door.status != 'overweight') {
            this.door.status = 'closing';
            if (this.door.status !='obstruction') {
                this.door.status = 'closed';
            } else {
                this.operateDoors();
            }
        } else {
            while (this.door.status != 'overweight') {
                this.door.status = 'closing';
            }
            this.operateDoors();
        }
    }
}


class CallButton {
    //button to call the elevator
    constructor(id, floor, direction) {
        this.ID = id;
        this.status = "on"; //"on, off"
        this.floor = floor;
        this.direction = direction; //"up, down"
    }
}


class FloorRequestButton {
    //button inside the elevator to go to the requested floor
    constructor(id, floor) {
        this.ID = id;
        this.status = "OFF";
        this.floor = floor;
    }
}

class Door {
    //door status
    constructor(id, status) {
        this.ID = id;
        this.status = status; //"opened, closed";
    }
}


module.exports = { Column, Elevator, CallButton, FloorRequestButton, Door };